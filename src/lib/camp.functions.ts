import { createServerFn } from "@tanstack/react-start";

export const getCampSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicServerClient } = await import("./supabase-public.server");
  const client = createPublicServerClient();
  const { data, error } = await client
    .from("camp_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});
