/**
 * Minimal SMTP client — SERVER ONLY.
 *
 * Works both in the Cloudflare Worker runtime (via `cloudflare:sockets` + STARTTLS)
 * and in the Node-based dev server (via `node:tls` implicit TLS).
 *
 * Credentials are read from environment variables only and never leave the server.
 */

type Stream = {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  close: () => Promise<void>;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export function readSmtpConfig(): SmtpConfig | null {
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  const port = Number(process.env["SMTP_PORT"] ?? 465);
  if (!host || !user || !pass) return null;
  const from = process.env["SMTP_FROM"] || `CFG Summer Camp <${user}>`;
  return { host, port, user, pass: pass.replace(/\s+/g, ""), from };
}

class SmtpSession {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private buffer = "";

  constructor(stream: Stream) {
    this.reader = stream.readable.getReader();
    this.writer = stream.writable.getWriter();
  }

  async read(): Promise<{ code: number; text: string }> {
    // An SMTP reply ends with a line of the form "250 text" (no hyphen after code).
    for (;;) {
      const match = /^(\d{3})(?: [^\n]*)?\r?\n/m.exec(this.buffer);
      const lines = this.buffer.split(/\r?\n/);
      const complete = lines.some((line) => /^\d{3} /.test(line) || /^\d{3}$/.test(line));
      if (complete && match !== null) break;
      if (complete) break;
      const { value, done } = await this.reader.read();
      if (done) break;
      this.buffer += decoder.decode(value, { stream: true });
    }
    const text = this.buffer;
    this.buffer = "";
    const final = text
      .split(/\r?\n/)
      .filter((line) => /^\d{3}/.test(line))
      .pop();
    const code = final ? Number(final.slice(0, 3)) : 0;
    return { code, text };
  }

  async write(data: string): Promise<void> {
    await this.writer.write(encoder.encode(data));
  }

  async command(data: string, expected: number[]): Promise<{ code: number; text: string }> {
    await this.write(`${data}\r\n`);
    const reply = await this.read();
    if (!expected.includes(reply.code)) {
      const safe = data.startsWith("AUTH") || /^[A-Za-z0-9+/=]+$/.test(data) ? "<redacted>" : data;
      throw new Error(`SMTP command failed (${safe}): ${reply.code} ${reply.text.trim()}`);
    }
    return reply;
  }

  release() {
    try {
      this.reader.releaseLock();
    } catch {
      /* ignore */
    }
    try {
      this.writer.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

async function openWorkerStream(config: SmtpConfig): Promise<Stream> {
  const { connect } = (await import(/* @vite-ignore */ "cloudflare:sockets")) as {
    connect: (
      address: string,
      options?: { secureTransport?: "on" | "off" | "starttls"; allowHalfOpen?: boolean },
    ) => {
      readable: ReadableStream<Uint8Array>;
      writable: WritableStream<Uint8Array>;
      startTls: () => {
        readable: ReadableStream<Uint8Array>;
        writable: WritableStream<Uint8Array>;
      };
      close: () => Promise<void>;
    };
  };

  // Implicit TLS (465) is not available for outbound Worker sockets — use STARTTLS on 587.
  const port = config.port === 465 ? 587 : config.port;
  const socket = connect(`${config.host}:${port}`, {
    secureTransport: "starttls",
    allowHalfOpen: false,
  });

  const plain = new SmtpSession({
    readable: socket.readable,
    writable: socket.writable,
    close: () => socket.close(),
  });
  const greeting = await plain.read();
  if (greeting.code !== 220) throw new Error(`SMTP greeting failed: ${greeting.text.trim()}`);
  await plain.command(`EHLO ${config.host}`, [250]);
  await plain.command("STARTTLS", [220]);
  plain.release();

  const secure = socket.startTls();
  return {
    readable: secure.readable,
    writable: secure.writable,
    close: () => socket.close(),
  };
}

async function openNodeStream(config: SmtpConfig): Promise<Stream> {
  const tls = await import("node:tls");
  const { Duplex } = await import("node:stream");

  const socket = await new Promise<import("node:tls").TLSSocket>((resolve, reject) => {
    const s = tls.connect({ host: config.host, port: config.port, servername: config.host }, () =>
      resolve(s),
    );
    s.setTimeout(20000, () => s.destroy(new Error("SMTP connection timed out")));
    s.once("error", reject);
  });

  const web = Duplex.toWeb(socket) as unknown as {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
  };
  return {
    readable: web.readable,
    writable: web.writable,
    close: async () => {
      socket.destroy();
    },
  };
}

function isWorkerRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

function base64(value: string): string {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function dotStuff(body: string): string {
  return body.replace(/\r?\n/g, "\r\n").replace(/\r\n\./g, "\r\n..");
}

function buildMessage(config: SmtpConfig, to: string, subject: string, html: string, text: string) {
  const boundary = `cfg_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?UTF-8?B?${base64(subject)}?=`;
  return [
    `From: ${config.from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/** Send one email over SMTP. Never throws — returns a result the caller can log. */
export async function sendSmtpMail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = readSmtpConfig();
  if (!config) {
    console.error("[Email] SMTP credentials are not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)");
    return { success: false, error: "Email service not configured" };
  }

  let stream: Stream | undefined;
  let session: SmtpSession | undefined;
  try {
    stream = isWorkerRuntime() ? await openWorkerStream(config) : await openNodeStream(config);
    session = new SmtpSession(stream);

    if (!isWorkerRuntime()) {
      const greeting = await session.read();
      if (greeting.code !== 220) throw new Error(`SMTP greeting failed: ${greeting.text.trim()}`);
    }

    await session.command(`EHLO ${config.host}`, [250]);
    await session.command("AUTH LOGIN", [334]);
    await session.command(base64(config.user), [334]);
    await session.command(base64(config.pass), [235]);

    const fromAddress = /<([^>]+)>/.exec(config.from)?.[1] ?? config.user;
    await session.command(`MAIL FROM:<${fromAddress}>`, [250]);
    await session.command(`RCPT TO:<${options.to}>`, [250, 251]);
    await session.command("DATA", [354]);
    await session.write(
      `${dotStuff(buildMessage(config, options.to, options.subject, options.html, options.text))}\r\n.\r\n`,
    );
    const stored = await session.read();
    if (stored.code !== 250) throw new Error(`SMTP delivery failed: ${stored.text.trim()}`);
    try {
      await session.command("QUIT", [221, 250]);
    } catch {
      /* some servers close abruptly after QUIT */
    }

    console.log(`[Email] Sent "${options.subject}" to ${options.to}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Email] SMTP send failed for ${options.to}: ${message}`);
    return { success: false, error: message };
  } finally {
    session?.release();
    try {
      await stream?.close();
    } catch {
      /* ignore */
    }
  }
}
