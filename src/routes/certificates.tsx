import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, Download, Eye, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { campSettingsQueryOptions, FALLBACK_SETTINGS } from "@/lib/camp";
import {
  issueCertificate,
  searchParticipants,
  type IssuedCertificate,
  type ParticipantMatch,
} from "@/lib/certificate.functions";
import {
  CERTIFICATE_EVENT,
  certificatePreviewUrl,
  downloadCertificate,
} from "@/lib/certificate-pdf";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Generate your CFG Camp 2026 Certificate of Participation" },
      {
        name: "description",
        content:
          "Participants of the CFG Children & Youth Summer Camp 2026 can look up their name on the official list and download a printable Certificate of Participation.",
      },
      { property: "og:title", content: "Generate your CFG Camp 2026 Certificate" },
      {
        property: "og:description",
        content:
          "Enter your name exactly as it appears on the official camp participant list to generate your Certificate of Participation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { data } = useQuery(campSettingsQueryOptions);
  const settings = data ?? FALLBACK_SETTINGS;
  const search = useServerFn(searchParticipants);
  const issue = useServerFn(issueCertificate);

  const [name, setName] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<ParticipantMatch[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<IssuedCertificate | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearching(true);
    setNotFound(false);
    setMatches(null);
    setCertificate(null);
    try {
      const response = await search({ data: { name } });
      if (response.matches.length === 0) setNotFound(true);
      else if (response.matches.length === 1) await generate(response.matches[0]!);
      else setMatches(response.matches);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function generate(participant: ParticipantMatch) {
    setGeneratingId(participant.id);
    try {
      const issued = await issue({ data: { participantId: participant.id } });
      setCertificate(issued);
      setMatches(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the certificate");
    } finally {
      setGeneratingId(null);
    }
  }

  async function onDownload() {
    if (!certificate) return;
    setBusy(true);
    try {
      await downloadCertificate(certificate);
      toast.success("Your certificate has been downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build the PDF");
    } finally {
      setBusy(false);
    }
  }

  async function onView() {
    if (!certificate) return;
    setBusy(true);
    try {
      const url = await certificatePreviewUrl(certificate);
      window.open(url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the certificate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
          Certificates
        </p>
        <h1 className="font-display mt-2 text-3xl font-black text-primary sm:text-4xl">
          Generate Your Certificate
        </h1>
        <p className="mt-3 max-w-xl text-sm font-medium text-foreground/70">
          Enter your name exactly as it appears on the official camp participant list to generate
          your Certificate of Participation.
        </p>

        <form onSubmit={onSearch} className="card-soft mt-8 grid gap-4 p-6">
          <div>
            <label htmlFor="participant-name" className="text-sm font-bold text-foreground/85">
              Enter your full name
            </label>
            <input
              id="participant-name"
              required
              autoComplete="name"
              placeholder="e.g. Alhagie Omar Jallow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <Button
              type="submit"
              disabled={searching || generatingId !== null}
              size="lg"
              className="rounded-full px-6 font-extrabold"
            >
              {searching || generatingId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Generate Certificate
            </Button>
          </div>
        </form>

        {notFound && (
          <div className="card-soft mt-6 border border-destructive/30 p-6">
            <p className="text-sm font-semibold text-foreground/85">
              ❌ We couldn't find that name on the official camp participant list. Please check the
              spelling and try again.
            </p>
          </div>
        )}

        {matches && matches.length > 1 && (
          <div className="card-soft mt-6 p-6">
            <p className="text-sm font-bold text-foreground/85">We found these participants:</p>
            <ul className="mt-4 space-y-2">
              {matches.map((match) => (
                <li key={match.id}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generate(match)}
                    disabled={generatingId !== null}
                    className="h-auto w-full justify-between whitespace-normal rounded-xl px-4 py-3 text-left font-bold"
                  >
                    {match.full_name}
                    {generatingId === match.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Award className="h-4 w-4 text-accent-foreground" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs font-semibold text-foreground/60">
              Select your correct name to generate your certificate.
            </p>
          </div>
        )}

        {certificate && (
          <div className="card-soft animate-rise mt-6 overflow-hidden">
            <div className="bg-camp-hero px-6 py-6 text-primary-foreground">
              <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">
                Certificate of Participation
              </p>
              <h2 className="font-display mt-1 text-2xl font-black">{certificate.full_name}</h2>
              <p className="mt-2 text-xs font-semibold text-primary-foreground/80">
                {CERTIFICATE_EVENT.campName} · {CERTIFICATE_EVENT.edition}
              </p>
              <p className="text-xs font-semibold text-primary-foreground/70">
                {CERTIFICATE_EVENT.dates} · {CERTIFICATE_EVENT.venue}
              </p>
              <p className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-[0.12em] text-accent">
                ID: {certificate.certificate_number}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 px-6 py-5">
              <Button
                type="button"
                variant="outline"
                onClick={onView}
                disabled={busy}
                size="lg"
                className="rounded-full border-primary px-6 font-extrabold text-primary"
              >
                <Eye className="h-4 w-4" />
                View Certificate
              </Button>
              <Button
                type="button"
                onClick={onDownload}
                disabled={busy}
                size="lg"
                className="rounded-full px-6 font-extrabold"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Certificate
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
