import template from "@/assets/certificate-template.jpg.asset.json";
import type { IssuedCertificate } from "./certificate.functions";

const GREEN: [number, number, number] = [20, 71, 55];
const GOLD: [number, number, number] = [176, 141, 45];

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

async function loadTemplateDataUrl(): Promise<string> {
  const response = await fetch(template.url);
  if (!response.ok) throw new Error("Could not load the certificate template");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("template read failed"));
    reader.readAsDataURL(blob);
  });
}

export function certificateFileName(fullName: string): string {
  const safe = fullName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `CFG-Certificate-${safe || "Participant"}.pdf`;
}

function fitName(doc: import("jspdf").jsPDF, name: string, maxWidth: number) {
  let size = 42;
  doc.setFont("times", "bold");
  while (size > 20) {
    doc.setFontSize(size);
    if (doc.getTextWidth(name) <= maxWidth) break;
    size -= 1;
  }
  return size;
}

/**
 * Builds the A4 landscape certificate using the official CFG sample as the exact
 * background. Only the participant's approved name and role are printed on it.
 */
export async function buildCertificatePdf(certificate: IssuedCertificate) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const centerX = width / 2;

  const templateData = await loadTemplateDataUrl();
  doc.addImage(templateData, "JPEG", 0, 0, width, height, undefined, "FAST");

  const officialName = certificate.full_name.trim();
  doc.setTextColor(...GREEN);
  doc.setFontSize(fitName(doc, officialName, width * 0.62));
  doc.text(officialName, centerX, 272, { align: "center" });

  const role = (certificate.role || "Participant").trim();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GOLD);
  doc.text(role.toUpperCase(), centerX, 333, { align: "center", charSpace: 1.4 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 125, 118);
  doc.text(`Certificate ID: ${certificate.certificate_number}`, centerX, height - 16, {
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
