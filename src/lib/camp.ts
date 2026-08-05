import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { getCampSettings } from "./camp.functions";

export type CampSettings = Database["public"]["Tables"]["camp_settings"]["Row"];
export type Registration = Database["public"]["Tables"]["registrations"]["Row"];

export const campSettingsQueryOptions = queryOptions({
  queryKey: ["camp-settings"],
  queryFn: () => getCampSettings(),
});

export const FALLBACK_SETTINGS: CampSettings = {
  id: 1,
  camp_name: "Children & Youth Summer Camp",
  theme: "Empowering Youth for Peaceful Democratic Participation",
  edition: "7th Edition",
  camp_dates: "3 - 9 September 2026",
  venue: "Kwinella Senior Secondary School",
  camp_fee: "D1000",
  whatsapp_link: "",
  contact_phone: "+220 392 8131 / +220 259 9852 / +220 360 7188",
  contact_email: "info@childrenfoundationgambia.org",
  payment_instructions: "",
  updated_at: new Date().toISOString(),
};

export function phoneList(phones: string): string[] {
  return phones
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
}
