import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { campSettingsQueryOptions, FALLBACK_SETTINGS } from "@/lib/camp";
import { lookupRegistrationReceipt, type ReceiptRegistration } from "@/lib/receipt.functions";
import { downloadRegistrationReceipt } from "@/lib/receipt-pdf";

export const Route = createFileRoute("/receipt")({
  head: () => ({
    meta: [
      { title: "Download your camp registration slip — CFG" },
      {
        name: "description",
        content:
          "Approved CFG Summer Camp participants can look up their registration and download a PDF slip with their details and payment status.",
      },
      { property: "og:title", content: "Download your camp registration slip — CFG" },
      {
        property: "og:description",
        content: "Save your proof of registration and payment for the CFG Children & Youth Summer Camp.",
      },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { data } = useQuery(campSettingsQueryOptions);
  const settings = data ?? FALLBACK_SETTINGS;
  const lookup = useServerFn(lookupRegistrationReceipt);

  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ReceiptRegistration | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      const response = await lookup({ data: { email, dateOfBirth } });
      if (response.found) setResult(response.registration);
      else setNotFound(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function onDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      await downloadRegistrationReceipt(result, settings);
      toast.success("Your registration slip has been downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build the PDF");
    } finally {
      setDownloading(false);
    }
  }

  const approved = result?.status === "approved";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
          Participants
        </p>
        <h1 className="font-display mt-2 text-3xl font-black text-primary sm:text-4xl">
          Download your registration slip
        </h1>
        <p className="mt-3 max-w-xl text-sm font-medium text-foreground/70">
          Enter the email address and date of birth used during registration to view your status and
          save a PDF proof of registration and payment.
        </p>

        <form onSubmit={onSubmit} className="card-soft mt-8 grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <label htmlFor="receipt-email" className="text-sm font-bold text-foreground/85">
              Email address
            </label>
            <input
              id="receipt-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="receipt-dob" className="text-sm font-bold text-foreground/85">
              Date of birth
            </label>
            <input
              id="receipt-dob"
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Find my registration
            </button>
          </div>
        </form>

        {notFound && (
          <div className="card-soft mt-6 p-6">
            <p className="text-sm font-bold text-foreground/85">No registration found</p>
            <p className="mt-1.5 text-sm font-medium text-foreground/65">
              Check the email address and date of birth, or{" "}
              <Link to="/register" className="font-bold text-primary underline">
                submit a registration
              </Link>
              .
            </p>
          </div>
        )}

        {result && (
          <div className="card-soft animate-rise mt-6 overflow-hidden">
            <div className="bg-camp-hero px-6 py-5 text-primary-foreground">
              <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">
                {settings.camp_name} — {settings.edition}
              </p>
              <h2 className="font-display mt-1 text-2xl font-black">{result.full_name}</h2>
              <p className="mt-1 text-xs font-semibold text-primary-foreground/75">
                Reference {result.id}
              </p>
            </div>
            <dl className="grid gap-4 p-6 sm:grid-cols-2">
              <Detail label="Status" value={result.status} emphasis />
              <Detail label="Camp fee" value={settings.camp_fee} />
              <Detail label="Dates" value={settings.camp_dates} />
              <Detail label="Venue" value={settings.venue} />
              <Detail label="School" value={result.school} />
              <Detail label="Guardian" value={`${result.guardian_name} · ${result.guardian_phone}`} />
              <Detail
                label="Payment receipt"
                value={result.has_receipt ? "Submitted" : "Not uploaded"}
              />
              <Detail
                label="Verification"
                value={approved ? "Verified by CFG" : "Awaiting verification"}
              />
            </dl>
            <div className="flex flex-wrap items-center gap-3 border-t border-border/70 px-6 py-5">
              <button
                onClick={onDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF slip
              </button>
              {!approved && (
                <p className="flex items-center gap-2 text-xs font-semibold text-foreground/60">
                  <FileText className="h-3.5 w-3.5" />
                  Your slip is marked as pending until an administrator verifies your payment.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

function Detail({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-bold ${emphasis ? "text-leaf capitalize" : "text-foreground/85"}`}
      >
        {value}
      </dd>
    </div>
  );
}
