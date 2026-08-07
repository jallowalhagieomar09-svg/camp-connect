/**
 * Email service — SERVER ONLY.
 *
 * Sends transactional camp emails through the project's Gmail SMTP credentials.
 * Credentials live in environment variables and are never exposed to the client.
 */

import type { Registration } from "@/lib/camp";
import { sendSmtpMail } from "@/lib/smtp.server";
import { createPublicServerClient } from "@/lib/supabase-public.server";

const CAMP_NAME = "CFG Children and Youth Summer Camp";
const CAMP_DATES = "3rd to 11th September 2026";
const CAMP_VENUE = "Kwinella Senior Secondary School";

/**
 * Configurable WhatsApp group link: camp settings in the database take priority,
 * falling back to the WHATSAPP_GROUP_LINK environment variable.
 */
export async function getWhatsAppGroupLink(): Promise<string> {
  try {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("camp_settings")
      .select("whatsapp_link")
      .eq("id", 1)
      .maybeSingle();
    if (data?.whatsapp_link) return data.whatsapp_link.trim();
  } catch (error) {
    console.warn("[Email] Could not read WhatsApp link from camp settings:", error);
  }
  return (process.env["WHATSAPP_GROUP_LINK"] ?? "").trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

function layout(heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:24px;background:#f6f4ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#233b36;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(20,60,55,.08);">
      <tr><td style="background:#0f4c46;padding:32px 28px;text-align:center;">
        <p style="margin:0;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#e8c877;font-weight:700;">${escapeHtml(CAMP_NAME)}</p>
        <h1 style="margin:10px 0 0;font-size:24px;color:#ffffff;">${escapeHtml(heading)}</h1>
      </td></tr>
      <tr><td style="padding:32px 28px;font-size:15px;line-height:1.75;">${bodyHtml}</td></tr>
      <tr><td style="padding:20px 28px;background:#f6f4ec;text-align:center;font-size:12px;color:#6b7c78;">
        This is an automated message from the ${escapeHtml(CAMP_NAME)} registration system.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function paragraphs(lines: string[]): string {
  return lines.map((line) => `<p style="margin:0 0 16px;">${line}</p>`).join("");
}

export async function sendApprovalEmail(
  registration: Registration,
): Promise<{ success: boolean; error?: string }> {
  const link = await getWhatsAppGroupLink();
  const name = registration.full_name;
  const safeName = escapeHtml(name);
  const subject =
    "Congratulations! You Have Been Accepted for the CFG Children and Youth Summer Camp";

  const whatsappHtml = link
    ? `<p style="margin:0 0 8px;">Please join the WhatsApp group using the link below:</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0f4c46;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:700;">Join the WhatsApp group</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#6b7c78;word-break:break-all;">${escapeHtml(link)}</p>`
    : `<p style="margin:0 0 16px;">The official WhatsApp group link will be shared with you shortly — please watch your inbox.</p>`;

  const html = layout(
    "Congratulations! 🎉",
    paragraphs([
      `Dear ${safeName},`,
      "Congratulations! 🎉",
      `We are pleased to inform you that your application for the <strong>${escapeHtml(CAMP_NAME)}</strong> has been accepted.`,
      `We are excited to welcome you to this year's camp, which will take place from <strong>${CAMP_DATES}</strong> at <strong>${CAMP_VENUE}</strong>.`,
      "As an accepted participant, you will be added to the official WhatsApp group where important updates, announcements, schedules, and other camp information will be shared.",
    ]) +
      whatsappHtml +
      paragraphs([
        "We encourage you to join the group promptly to stay updated on all preparations ahead of the camp.",
        `Once again, congratulations, and we look forward to welcoming you to the ${escapeHtml(CAMP_NAME)}.`,
        `Warm regards,<br><strong>${escapeHtml(CAMP_NAME)} Team</strong>`,
      ]),
  );

  const text = [
    `Dear ${name},`,
    "",
    "Congratulations!",
    "",
    `We are pleased to inform you that your application for the ${CAMP_NAME} has been accepted.`,
    "",
    `We are excited to welcome you to this year's camp, which will take place from ${CAMP_DATES} at ${CAMP_VENUE}.`,
    "",
    "As an accepted participant, you will be added to the official WhatsApp group where important updates, announcements, schedules, and other camp information will be shared.",
    "",
    link
      ? `Please join the WhatsApp group using the link below:\n${link}`
      : "The official WhatsApp group link will be shared with you shortly.",
    "",
    "We encourage you to join the group promptly to stay updated on all preparations ahead of the camp.",
    "",
    `Once again, congratulations, and we look forward to welcoming you to the ${CAMP_NAME}.`,
    "",
    "Warm regards,",
    `${CAMP_NAME} Team`,
  ].join("\n");

  return sendSmtpMail({ to: registration.email, subject, html, text });
}

export async function sendRejectionEmail(
  registration: Registration,
): Promise<{ success: boolean; error?: string }> {
  const name = registration.full_name;
  const safeName = escapeHtml(name);
  const subject = `Update on your ${CAMP_NAME} application`;

  const html = layout(
    "Application update",
    paragraphs([
      `Dear ${safeName},`,
      `Thank you for applying to the <strong>${escapeHtml(CAMP_NAME)}</strong> and for the time you took to complete your application.`,
      "After careful review of all applications, we regret to inform you that we are unable to offer you a place at this year's camp. We received many more applications than the number of spaces available, and the decision was a difficult one.",
      "This outcome does not reflect on your potential or your commitment. We warmly encourage you to apply again for future editions of the camp and to take part in other Children Foundation The Gambia programmes.",
      "We are grateful for your interest and wish you every success in your studies and activities ahead.",
      `Warm regards,<br><strong>${escapeHtml(CAMP_NAME)} Team</strong>`,
    ]),
  );

  const text = [
    `Dear ${name},`,
    "",
    `Thank you for applying to the ${CAMP_NAME} and for the time you took to complete your application.`,
    "",
    "After careful review of all applications, we regret to inform you that we are unable to offer you a place at this year's camp. We received many more applications than the number of spaces available, and the decision was a difficult one.",
    "",
    "This outcome does not reflect on your potential or your commitment. We warmly encourage you to apply again for future editions of the camp and to take part in other Children Foundation The Gambia programmes.",
    "",
    "We are grateful for your interest and wish you every success in your studies and activities ahead.",
    "",
    "Warm regards,",
    `${CAMP_NAME} Team`,
  ].join("\n");

  return sendSmtpMail({ to: registration.email, subject, html, text });
}
