import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { campSettingsQueryOptions, FALLBACK_SETTINGS } from "@/lib/camp";

export const Route = createFileRoute("/register")({
  loader: ({ context }) => context.queryClient.ensureQueryData(campSettingsQueryOptions),
  head: () => ({
    meta: [
      { title: "Register — CFG Children & Youth Summer Camp" },
      {
        name: "description",
        content:
          "Complete the CFG Summer Camp registration form, upload your proof of payment and await verification from the Children Foundation The Gambia team.",
      },
      { property: "og:title", content: "Register — CFG Children & Youth Summer Camp" },
      {
        property: "og:description",
        content: "Fill in the participant details and upload your payment receipt to register.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Please enter the full name").max(120),
    date_of_birth: z.string().min(1, "Please select a date of birth"),
    gender: z.string().min(1, "Please select a gender"),
    school: z.string().trim().min(2, "Please enter the school name").max(160),
    guardian_name: z.string().trim().min(2, "Please enter the parent/guardian name").max(120),
    guardian_phone: z.string().trim().min(7, "Please enter a valid phone number").max(40),
    email: z.string().trim().email("Please enter a valid email address").max(160),
    home_address: z.string().trim().min(4, "Please enter the home address").max(300),
    emergency_contact: z.string().trim().min(5, "Please enter an emergency contact").max(160),
    has_disability: z.enum(["yes", "no"], { message: "Please select an option" }),
    disability_details: z.string().trim().max(600).optional(),
    has_health_condition: z.enum(["yes", "no"], { message: "Please select an option" }),
    health_condition_details: z.string().trim().max(600).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.has_disability === "yes" && (values.disability_details ?? "").trim().length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["disability_details"],
        message: "Please specify the type of disability",
      });
    }
    if (
      values.has_health_condition === "yes" &&
      (values.health_condition_details ?? "").trim().length < 3
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["health_condition_details"],
        message: "Please provide details of the health condition",
      });
    }
  });


const FIELDS = [
  { name: "full_name", label: "Full name", type: "text", placeholder: "Participant's full name" },
  { name: "date_of_birth", label: "Date of birth", type: "date", placeholder: "" },
  { name: "school", label: "School", type: "text", placeholder: "Name of school" },
  {
    name: "guardian_name",
    label: "Parent / guardian name",
    type: "text",
    placeholder: "Full name",
  },
  {
    name: "guardian_phone",
    label: "Parent / guardian phone",
    type: "tel",
    placeholder: "+220 000 0000",
  },
  { name: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
  {
    name: "emergency_contact",
    label: "Emergency contact",
    type: "text",
    placeholder: "Name & phone number",
  },
] as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

function RegisterPage() {
  const { data } = useSuspenseQuery(campSettingsQueryOptions);
  const settings = data ?? FALLBACK_SETTINGS;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries()) as Record<string, string>;

    const parsed = schema.safeParse(values);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }
    if (!file) {
      nextErrors["receipt"] = "Please upload your proof of payment";
    } else if (file.size > 10 * 1024 * 1024) {
      nextErrors["receipt"] = "File must be smaller than 10MB";
    } else if (!/(image\/|application\/pdf)/.test(file.type)) {
      nextErrors["receipt"] = "Only images or PDF files are allowed";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !parsed.success || !file) return;

    setSubmitting(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "dat";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("registrations").insert({
        ...parsed.data,
        receipt_path: path,
        status: "pending",
      });
      if (insertError) throw insertError;

      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      toast.error("We could not submit your registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {done ? (
          <div className="card-soft animate-rise p-8 text-center sm:p-12">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-leaf/15 text-leaf">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-6 text-3xl font-black text-primary">Registration received!</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-foreground/75">
              Thank you for registering for the {settings.camp_name}. Your status is{" "}
              <strong className="text-primary">Pending Approval</strong> while our team verifies
              your payment receipt. Once verified, you will receive a confirmation email with the
              link to join the camp WhatsApp group.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/"
                className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
              >
                Back to home
              </Link>
              <a
                href={`tel:${settings.contact_phone.split("/")[0]?.trim().replace(/\s/g, "")}`}
                className="rounded-full border border-border px-6 py-3 text-sm font-bold text-primary"
              >
                Call the camp team
              </a>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold tracking-[0.2em] text-accent-foreground/70 uppercase">
              {settings.edition} · {settings.camp_dates}
            </p>
            <h1 className="mt-2 text-3xl font-black text-primary sm:text-4xl">
              Camp registration form
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70">
              Camp fee is <strong className="text-primary">{settings.camp_fee}</strong>. Please pay
              first, then complete this form and upload your proof of payment.
            </p>

            <form onSubmit={onSubmit} className="card-soft mt-8 space-y-5 p-6 sm:p-8" noValidate>
              {FIELDS.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="text-sm font-bold text-foreground/85"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                  <FieldError message={errors[field.name]} />
                </div>
              ))}

              <div>
                <label htmlFor="gender" className="text-sm font-bold text-foreground/85">
                  Gender
                </label>
                <select id="gender" name="gender" defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <FieldError message={errors["gender"]} />
              </div>

              <div>
                <label htmlFor="home_address" className="text-sm font-bold text-foreground/85">
                  Home address
                </label>
                <textarea
                  id="home_address"
                  name="home_address"
                  rows={3}
                  placeholder="Town / village, district"
                  className={inputClass}
                />
                <FieldError message={errors["home_address"]} />
              </div>

              <div>
                <span className="text-sm font-bold text-foreground/85">
                  Proof of payment (image or PDF)
                </span>
                <label
                  htmlFor="receipt"
                  className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-muted/60 px-4 py-4 text-sm font-semibold text-foreground/70 transition-colors hover:border-primary"
                >
                  <Upload className="h-5 w-5 text-primary" />
                  {file ? file.name : "Tap to upload your receipt"}
                </label>
                <input
                  id="receipt"
                  name="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <FieldError message={errors["receipt"]} />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-extrabold text-accent-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {submitting ? "Submitting…" : "Submit registration"}
              </button>
            </form>
          </>
        )}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-destructive">{message}</p>;
}
