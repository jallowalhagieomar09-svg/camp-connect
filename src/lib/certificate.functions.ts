import { createServerFn } from "@tanstack/react-start";

export type ParticipantMatch = { id: string; full_name: string; role: string };

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function tokens(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

/**
 * Searches the official participant list. Matching ignores case and extra spaces.
 * A single-word query only matches an exact full name; multi-word queries match
 * participants whose name contains every word typed. Never returns the full list.
 */
export const searchParticipants = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string }) => ({ name: String(data.name ?? "").slice(0, 120) }))
  .handler(async ({ data }): Promise<{ matches: ParticipantMatch[] }> => {
    const queryTokens = tokens(data.name);
    if (queryTokens.length === 0) return { matches: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const filter = queryTokens.map((token) => `normalized_name.ilike.%${token}%`).join(",");
    const { data: rows, error } = await supabaseAdmin
      .from("camp_participants")
      .select("id, full_name, normalized_name, role")
      .or(filter)
      .limit(200);

    if (error) throw new Error(error.message);

    const exact = (rows ?? []).filter((row) => row.normalized_name === normalize(data.name));
    if (exact.length > 0) {
      return { matches: exact.map((row) => ({ id: row.id, full_name: row.full_name, role: row.role })) };
    }

    if (queryTokens.length === 1) return { matches: [] };

    const matches = (rows ?? [])
      .filter((row) => {
        const rowTokens = tokens(row.normalized_name);
        return queryTokens.every((token) => rowTokens.includes(token));
      })
      .slice(0, 8)
      .map((row) => ({ id: row.id, full_name: row.full_name, role: row.role }));

    return { matches };
  });

export type IssuedCertificate = {
  full_name: string;
  role: string;
  certificate_number: string;
  issued_at: string;
};

/** Returns the participant's permanent certificate number, creating it on first request. */
export const issueCertificate = createServerFn({ method: "POST" })
  .inputValidator((data: { participantId: string }) => ({
    participantId: String(data.participantId ?? ""),
  }))
  .handler(async ({ data }): Promise<IssuedCertificate> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: participant, error: participantError } = await supabaseAdmin
      .from("camp_participants")
      .select("id, full_name, role")
      .eq("id", data.participantId)
      .maybeSingle();

    if (participantError) throw new Error(participantError.message);
    if (!participant) throw new Error("That participant is not on the official camp list.");

    const { error: rpcError } = await supabaseAdmin.rpc("issue_certificate", {
      _participant_id: participant.id,
    });
    if (rpcError) throw new Error(rpcError.message);

    const { data: certificate, error: certificateError } = await supabaseAdmin
      .from("certificates")
      .select("certificate_number, issued_at")
      .eq("participant_id", participant.id)
      .maybeSingle();

    if (certificateError) throw new Error(certificateError.message);
    if (!certificate) throw new Error("Could not issue a certificate number. Please try again.");

    return {
      full_name: participant.full_name,
      role: participant.role,
      certificate_number: certificate.certificate_number,
      issued_at: certificate.issued_at,
    };
  });
