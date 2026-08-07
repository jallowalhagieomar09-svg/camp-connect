import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Confirms the signed-in account is an administrator.
 *
 * An account is an admin when it already holds the `admin` role, or when its email
 * is listed in the `admins` table (added by an existing administrator). The very first
 * account to sign in claims the admin role so the foundation can bootstrap its dashboard.
 */
export const ensureAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String(context.claims["email"] ?? "");
    const fullName = String(
      (context.claims["user_metadata"] as Record<string, unknown> | undefined)?.["full_name"] ??
        email.split("@")[0] ??
        "",
    );

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin) {
      await context.supabase
        .from("admins")
        .upsert({ id: context.userId, email, full_name: fullName, role: "admin" });
      return { isAdmin: true };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Already listed as an administrator (by account id or email)? Grant the role.
    let listed = false;
    if (email) {
      const { data: existing } = await supabaseAdmin
        .from("admins")
        .select("id, email")
        .or(`id.eq.${context.userId},email.eq.${email}`)
        .limit(1);
      listed = (existing?.length ?? 0) > 0;
    }

    if (!listed) {
      const { count, error } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (error) throw new Error(error.message);
      if ((count ?? 0) > 0) return { isAdmin: false };
    }

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertError && !insertError.message.includes("duplicate")) {
      throw new Error(insertError.message);
    }
    await supabaseAdmin
      .from("admins")
      .upsert({ id: context.userId, email, full_name: fullName, role: "admin" });
    return { isAdmin: true };
  });

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("admins")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });


export const listRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getReceiptUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("payment-receipts")
      .createSignedUrl(data.path, 60 * 30);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const setRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "approved" | "rejected" | "pending" }) => data)
  .handler(async ({ data, context }) => {
    // Update the status in the database
    const { data: row, error } = await context.supabase
      .from("registrations")
      .update({ status: data.status, reviewed_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Registration not found");

    // Send email notification after successful database update
    // Email failures should not prevent the status update
    let emailSent = false;
    try {
      const { sendApprovalEmail, sendRejectionEmail } = await import("@/lib/email.server");
      
      if (data.status === "approved") {
        const result = await sendApprovalEmail(row);
        emailSent = result.success;
        if (!result.success) {
          console.warn(`[Admin] Approval email failed for registration ${row.id}: ${result.error}`);
        }
      } else if (data.status === "rejected") {
        const result = await sendRejectionEmail(row);
        emailSent = result.success;
        if (!result.success) {
          console.warn(`[Admin] Rejection email failed for registration ${row.id}: ${result.error}`);
        }
      }
    } catch (emailError) {
      // Log the error but don't throw - the status update was successful
      console.error("[Admin] Email notification error:", emailError);
    }

    return { registration: row, emailSent };
  });

export const deleteRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("registrations")
      .select("receipt_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.receipt_path) {
      await context.supabase.storage.from("payment-receipts").remove([row.receipt_path]);
    }
    const { error } = await context.supabase.from("registrations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCampSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      camp_name: string;
      theme: string;
      edition: string;
      camp_dates: string;
      venue: string;
      camp_fee: string;
      whatsapp_link: string;
      contact_phone: string;
      contact_email: string;
      payment_instructions: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("camp_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
