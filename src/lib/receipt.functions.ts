import { createServerFn } from "@tanstack/react-start";

export type ReceiptRegistration = {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  school: string;
  guardian_name: string;
  guardian_phone: string;
  email: string;
  home_address: string;
  emergency_contact: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  has_receipt: boolean;
};

/**
 * Participant self-service lookup for the registration receipt.
 * Requires an exact match on BOTH email and date of birth, and only ever returns
 * the participant's own submitted details (never other rows, never the receipt file).
 */
export const lookupRegistrationReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; dateOfBirth: string }) => ({
    email: String(data.email ?? "")
      .trim()
      .toLowerCase(),
    dateOfBirth: String(data.dateOfBirth ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    if (!data.email || !data.dateOfBirth) {
      return { found: false as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("registrations")
      .select(
        "id, full_name, date_of_birth, gender, school, guardian_name, guardian_phone, email, home_address, emergency_contact, status, created_at, reviewed_at, receipt_path",
      )
      .ilike("email", data.email)
      .eq("date_of_birth", data.dateOfBirth)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) return { found: false as const };

    const { receipt_path, ...rest } = row;
    const registration: ReceiptRegistration = { ...rest, has_receipt: Boolean(receipt_path) };
    return { found: true as const, registration };
  });
