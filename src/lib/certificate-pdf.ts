import logo from "@/assets/cfg-logo.png.asset.json";
import type { IssuedCertificate } from "./certificate.functions";

const GREEN: [number, number, number] = [7, 65, 52];
const GREEN_LIGHT: [number, number, number] = [24, 92, 73];
const GOLD: [number, number, number] = [204, 169, 73];
const INK: [number, number, number] = [18, 55, 48];
const WHITE: [number, number, number] = [255, 255, 253];

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
  dates: "3rd–9th September 2026",
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

function drawCornerGeometry(doc: import("jspdf").jsPDF, width: number, height: number) {
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, width, 15, "F");
  doc.rect(0, height - 15, width, 15, "F");
  doc.rect(0, 0, 14, height, "F");
  doc.rect(width - 14, 0, 14, height, "F");

  doc.setFillColor(...GREEN);
  doc.triangle(width - 170, 0, width, 0, width, 170, "F");
  doc.triangle(0, height - 190, 0, height, 190, height, "F");
  doc.setFillColor(...GREEN_LIGHT);
  doc.triangle(width - 115, 0, width, 0, width, 115, "F");
  doc.triangle(0, height - 125, 0, height, 125, height, "F");

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(9);
  doc.line(width - 124, 0, width, 124);
  doc.line(0, height - 139, 139, height);
  doc.setLineWidth(3);
  doc.line(width - 95, 0, width, 95);
  doc.line(0, height - 104, 104, height);

  doc.setFillColor(...GREEN);
  doc.triangle(0, 245, 96, 342, 0, 439, "F");
  doc.triangle(width, 205, width - 78, 282, width, 359, "F");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(6);
  doc.line(0, 273, 68, 342);
  doc.line(68, 342, 0, 411);
  doc.line(width, 231, width - 50, 282);
  doc.line(width - 50, 282, width, 333);

  doc.setDrawColor(224, 208, 146);
  doc.setLineWidth(0.4);
  for (let i = 0; i < 9; i += 1) {
    const offset = i * 4;
    doc.line(18 + offset, 15, 42 + offset, 95);
    doc.line(width - 18 - offset, height - 15, width - 42 - offset, height - 95);
  }
}

function fitName(doc: import("jspdf").jsPDF, name: string, maxWidth: number) {
  let size = 39;
  doc.setFont("times", "bold");
  while (size > 23) {
    doc.setFontSize(size);
    if (doc.getTextWidth(name) <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function drawSignature(doc: import("jspdf").jsPDF, x: number, y: number, name: string, role: string) {
  doc.setDrawColor(41, 52, 114);
  doc.setLineWidth(1.1);
  doc.lines(
    [
      [14, -8], [8, 13], [9, -18], [7, 15], [12, -10], [10, 8], [16, -5], [13, 3],
    ],
    x - 44,
    y - 10,
  );
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.5);
  doc.line(x - 88, y + 5, x + 88, y + 5);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(name, x, y + 21, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(role, x, y + 36, { align: "center" });
}

/** Builds a vector/text A4 landscape certificate based on the official sample. */
export async function buildCertificatePdf(certificate: IssuedCertificate) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const centerX = width / 2;

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, width, height, "F");
  drawCornerGeometry(doc, width, height);

  const logoData = await loadLogoDataUrl();
  if (logoData) doc.addImage(logoData, "JPEG", centerX - 32, 36, 64, 64);

  doc.setTextColor(...GREEN);
  doc.setFont("times", "normal");
  doc.setFontSize(46);
  doc.text("CERTIFICATE", centerX, 143, { align: "center" });
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(17);
  doc.text("O F   P A R T I C I P A T I O N", centerX, 171, { align: "center" });

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.text("This is to certify that", centerX, 198, { align: "center" });

  const officialName = certificate.full_name.trim();
  doc.setTextColor(...GREEN_LIGHT);
  doc.setFontSize(fitName(doc, officialName, width - 245));
  doc.text(officialName, centerX, 249, { align: "center" });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(centerX - 116, 266, centerX - 14, 266);
  doc.line(centerX + 14, 266, centerX + 116, 266);
  doc.circle(centerX, 266, 4);

  const body =
    "Has participated in the Children and Youth Summer Camp organized by Children Foundation The Gambia in Kwinella from 3rd-9th September, 2026. We acknowledge and commend your active involvement and valuable contribution throughout the event.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...INK);
  const bodyLines = doc.splitTextToSize(body, 565);
  doc.text(bodyLines, centerX, 306, { align: "center", lineHeightFactor: 1.45 });

  drawSignature(doc, width * 0.34, 434, "Nfamara Dabo", "Chairman");
  drawSignature(doc, width * 0.66, 434, "Fatoumatta M. Jaiteh", "Administrative Officer");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(91, 112, 106);
  doc.text(`Certificate ID: ${certificate.certificate_number}`, centerX, height - 24, {
    align: "center",
  });

  doc.setProperties({
    title: `Certificate of Participation — ${officialName}`,
    subject: CERTIFICATE_EVENT.campName,
    author: "Children Foundation The Gambia",
    keywords: `CFG, certificate, ${certificate.certificate_number}`,
  });
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