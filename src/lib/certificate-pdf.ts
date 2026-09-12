import logo from "@/assets/cfg-logo.png.asset.json";
import type { IssuedCertificate } from "./certificate.functions";

const TEAL: [number, number, number] = [12, 84, 82];
const GOLD: [number, number, number] = [201, 160, 60];
const INK: [number, number, number] = [38, 46, 45];
const MUTED: [number, number, number] = [110, 122, 120];
const CREAM: [number, number, number] = [253, 251, 245];

export type CertificateEvent = {
  campName: string;
  edition: string;
  dates: string;
  venue: string;
  theme: string;
};

export const CERTIFICATE_EVENT: CertificateEvent = {
  campName: "CFG Children & Youth Summer Camp 2026",
  edition: "7th Edition",
  dates: "3rd - 9th September 2026",
  venue: "Kwinella Senior Secondary School",
  theme: "Empowering Youth for Peaceful Democratic Participation",
};

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(logo.url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("logo read failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function certificateFileName(fullName: string): string {
  const safe = fullName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `CFG-Certificate-${safe || "Participant"}.pdf`;
}

/** Builds the A4 landscape Certificate of Participation and returns it as a jsPDF document. */
export async function buildCertificatePdf(certificate: IssuedCertificate) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background + decorative borders
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, width, height, "F");

  doc.setFillColor(...TEAL);
  doc.rect(0, 0, width, 14, "F");
  doc.rect(0, height - 14, width, 14, "F");
  doc.rect(0, 0, 14, height, "F");
  doc.rect(width - 14, 0, 14, height, "F");

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(3);
  doc.rect(28, 28, width - 56, height - 56);
  doc.setLineWidth(0.8);
  doc.rect(38, 38, width - 76, height - 76);

  // Corner flourishes
  doc.setFillColor(...GOLD);
  const corners: [number, number][] = [
    [38, 38],
    [width - 62, 38],
    [38, height - 62],
    [width - 62, height - 62],
  ];
  for (const [cx, cy] of corners) doc.rect(cx, cy, 24, 24, "F");

  // Logo
  const logoData = await loadLogoDataUrl();
  const centerX = width / 2;
  if (logoData) {
    doc.addImage(logoData, "PNG", centerX - 34, 56, 68, 68);
  }

  doc.setTextColor(...TEAL);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("CHILDREN FOUNDATION THE GAMBIA (CFG)", centerX, logoData ? 144 : 96, {
    align: "center",
  });

  doc.setFont("times", "bold");
  doc.setFontSize(38);
  doc.setTextColor(...GOLD);
  doc.text("CERTIFICATE", centerX, 190, { align: "center" });
  doc.setFontSize(15);
  doc.setTextColor(...TEAL);
  doc.text("OF PARTICIPATION", centerX, 212, { align: "center" });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.line(centerX - 90, 224, centerX + 90, 224);

  doc.setFont("times", "italic");
  doc.setFontSize(12.5);
  doc.setTextColor(...MUTED);
  doc.text("This certificate is proudly presented to", centerX, 250, { align: "center" });

  // Participant name
  doc.setFont("times", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...INK);
  const nameLines = doc.splitTextToSize(certificate.full_name.toUpperCase(), width - 220);
  doc.text(nameLines, centerX, 290, { align: "center" });
  const nameBottom = 290 + (nameLines.length - 1) * 34;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(1);
  doc.line(centerX - 200, nameBottom + 14, centerX + 200, nameBottom + 14);

  // Body
  doc.setFont("times", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...INK);
  const body =
    `for active and valued participation in the ${CERTIFICATE_EVENT.campName}, ` +
    `${CERTIFICATE_EVENT.edition}, held from ${CERTIFICATE_EVENT.dates} at ` +
    `${CERTIFICATE_EVENT.venue}, under the theme "${CERTIFICATE_EVENT.theme}".`;
  const bodyLines = doc.splitTextToSize(body, width - 260);
  doc.text(bodyLines, centerX, nameBottom + 44, { align: "center", lineHeightFactor: 1.5 });

  // Signature areas
  const signatureY = height - 96;
  const signature = (x: number, role: string) => {
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.8);
    doc.line(x - 90, signatureY, x + 90, signatureY);
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...TEAL);
    doc.text(role, x, signatureY + 17, { align: "center" });
  };
  signature(width * 0.27, "CAMP DIRECTOR");
  signature(width * 0.73, "EXECUTIVE DIRECTOR, CFG");

  // Seal + certificate id
  doc.setFillColor(...GOLD);
  doc.circle(centerX, signatureY - 4, 30, "F");
  doc.setFillColor(...TEAL);
  doc.circle(centerX, signatureY - 4, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("CFG", centerX, signatureY - 6, { align: "center" });
  doc.setFontSize(6.5);
  doc.text("2026", centerX, signatureY + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`Certificate ID: ${certificate.certificate_number}`, 52, height - 30);
  const issued = new Date(certificate.issued_at);
  doc.text(
    `Issued: ${Number.isNaN(issued.getTime()) ? "" : issued.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    width - 52,
    height - 30,
    { align: "right" },
  );

  return doc;
}

export async function downloadCertificate(certificate: IssuedCertificate) {
  const doc = await buildCertificatePdf(certificate);
  doc.save(certificateFileName(certificate.full_name));
}

export async function certificatePreviewUrl(certificate: IssuedCertificate): Promise<string> {
  const doc = await buildCertificatePdf(certificate);
  return doc.output("bloburl").toString();
}
