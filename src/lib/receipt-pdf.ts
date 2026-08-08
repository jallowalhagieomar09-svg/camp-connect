import type { CampSettings } from "./camp";
import type { ReceiptRegistration } from "./receipt.functions";
import logo from "@/assets/cfg-logo.png.asset.json";

const TEAL: [number, number, number] = [12, 84, 82];
const GOLD: [number, number, number] = [201, 160, 60];
const INK: [number, number, number] = [38, 46, 45];
const MUTED: [number, number, number] = [110, 122, 120];

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

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

/** Builds and downloads the participant's proof-of-registration slip as a PDF. */
export async function downloadRegistrationReceipt(
  registration: ReceiptRegistration,
  settings: CampSettings,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;

  // Header band
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageWidth, 132, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 132, pageWidth, 5, "F");

  const logoData = await loadLogoDataUrl();
  if (logoData) {
    doc.setFillColor(255, 255, 255);
    doc.circle(margin + 28, 62, 32, "F");
    doc.addImage(logoData, "PNG", margin, 34, 56, 56);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Children Foundation The Gambia", margin + (logoData ? 76 : 0), 56);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${settings.camp_name} — ${settings.edition}`, margin + (logoData ? 76 : 0), 76);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PROOF OF REGISTRATION", margin + (logoData ? 76 : 0), 96);

  let y = 176;
  doc.setTextColor(...INK);
  doc.setFontSize(20);
  doc.text(registration.full_name, margin, y);

  // Status pill
  const approved = registration.status === "approved";
  const label = approved ? "APPROVED" : registration.status.toUpperCase();
  doc.setFontSize(9);
  const pillWidth = doc.getTextWidth(label) + 24;
  if (approved) doc.setFillColor(30, 122, 90);
  else doc.setFillColor(...MUTED);
  doc.roundedRect(pageWidth - margin - pillWidth, y - 14, pillWidth, 20, 10, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(label, pageWidth - margin - pillWidth + 12, y);

  y += 18;
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Reference: ${registration.id}`, margin, y);

  const section = (title: string) => {
    y += 34;
    doc.setDrawColor(226, 230, 229);
    doc.line(margin, y - 14, pageWidth - margin, y - 14);
    doc.setTextColor(...TEAL);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), margin, y);
    y += 6;
  };

  const field = (labelText: string, value: string) => {
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(labelText, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(value || "—", pageWidth - margin * 2 - 160);
    doc.text(lines, margin + 160, y);
    if (lines.length > 1) y += (lines.length - 1) * 13;
  };

  section("Camp details");
  field("Camp", `${settings.camp_name} (${settings.edition})`);
  field("Theme", settings.theme);
  field("Dates", settings.camp_dates);
  field("Venue", settings.venue);

  section("Participant");
  field("Date of birth", formatDate(registration.date_of_birth));
  field("Gender", registration.gender);
  field("School", registration.school);
  field("Home address", registration.home_address);

  section("Parent / guardian");
  field("Name", registration.guardian_name);
  field("Phone", registration.guardian_phone);
  field("Email", registration.email);
  field("Emergency contact", registration.emergency_contact);

  section("Payment");
  field("Camp fee", settings.camp_fee);
  field("Payment status", registration.has_receipt ? "Receipt submitted" : "No receipt on file");
  field(
    "Verification",
    approved ? "Verified by the CFG camp team" : "Awaiting verification by the CFG camp team",
  );
  field("Submitted on", formatDate(registration.created_at));
  if (registration.reviewed_at) field("Reviewed on", formatDate(registration.reviewed_at));

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 74;
  doc.setFillColor(...TEAL);
  doc.rect(0, footerY, pageWidth, 74, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    approved
      ? "This slip confirms an approved registration and verified payment for the camp above."
      : "This slip confirms a submitted registration. Payment verification is still in progress.",
    margin,
    footerY + 26,
  );
  doc.text(`${settings.contact_phone}  ·  ${settings.contact_email}`, margin, footerY + 44);

  const safeName = registration.full_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`cfg-camp-registration-${safeName}.pdf`);
}
