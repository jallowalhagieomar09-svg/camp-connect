import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getCampSettings } from "@/lib/camp.functions";
import { saveCampSettings } from "@/lib/admin.functions";
import { FALLBACK_SETTINGS } from "@/lib/camp";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Camp settings — CFG Camp Admin" },
      {
        name: "description",
        content: "Update camp name, dates, venue, fee and contact details for the CFG Summer Camp.",
      },
      { property: "og:title", content: "Camp settings — CFG Camp Admin" },
      { property: "og:description", content: "Internal CFG Summer Camp settings editor." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const FIELDS = [
  { name: "camp_name", label: "Camp name" },
  { name: "edition", label: "Edition" },
  { name: "theme", label: "Theme" },
  { name: "camp_dates", label: "Camp dates" },
  { name: "venue", label: "Venue" },
  { name: "camp_fee", label: "Camp fee" },
  { name: "contact_phone", label: "Contact phone numbers (separate with /)" },
  { name: "contact_email", label: "Contact email" },
  { name: "whatsapp_link", label: "WhatsApp group link (sent on approval)" },
] as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function SettingsPage() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getCampSettings);
  const save = useServerFn(saveCampSettings);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["camp-settings"],
    queryFn: () => fetchSettings(),
  });
  const settings = data ?? FALLBACK_SETTINGS;

  const mutation = useMutation({
    mutationFn: (values: Record<string, string>) =>
      save({
        data: {
          camp_name: values["camp_name"] ?? "",
          theme: values["theme"] ?? "",
          edition: values["edition"] ?? "",
          camp_dates: values["camp_dates"] ?? "",
          venue: values["venue"] ?? "",
          camp_fee: values["camp_fee"] ?? "",
          whatsapp_link: values["whatsapp_link"] ?? "",
          contact_phone: values["contact_phone"] ?? "",
          contact_email: values["contact_email"] ?? "",
          payment_instructions: values["payment_instructions"] ?? "",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camp-settings"] });
      setSaved(true);
      toast.success("Camp details updated — the website now shows the new information.");
    },
    onError: () => toast.error("Could not save the camp details."),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black text-primary sm:text-3xl">Camp settings</h1>
      <p className="mt-2 text-sm text-foreground/65">
        These details appear across the public website and in approval emails.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<
            string,
            string
          >;
          mutation.mutate(values);
        }}
        className="card-soft mt-8 space-y-5 p-6 sm:p-8"
      >
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="text-sm font-bold text-foreground/85">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              defaultValue={settings[field.name] ?? ""}
              className={inputClass}
            />
          </div>
        ))}
        <div>
          <label htmlFor="payment_instructions" className="text-sm font-bold text-foreground/85">
            Payment instructions (shown on the fee section)
          </label>
          <textarea
            id="payment_instructions"
            name="payment_instructions"
            rows={3}
            defaultValue={settings.payment_instructions ?? ""}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save camp details
        </button>
        {saved ? (
          <p className="text-center text-xs font-semibold text-leaf">
            Saved. Refresh the public site to see the update.
          </p>
        ) : null}
      </form>
    </main>
  );
}
