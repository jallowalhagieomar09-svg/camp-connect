import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, FileText, Loader2, Trash2, Users, XCircle, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  ensureAdmin,
  listRegistrations,
  setRegistrationStatus,
  deleteRegistration,
  getReceiptUrl,
} from "@/lib/admin.functions";
import type { Registration } from "@/lib/camp";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Registrations dashboard — CFG Camp Admin" },
      { name: "description", content: "Review, approve and manage CFG Summer Camp registrations." },
      { property: "og:title", content: "Registrations dashboard — CFG Camp Admin" },
      { property: "og:description", content: "Internal CFG Summer Camp registration dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

const STATUS_TABS = ["all", "pending", "approved", "rejected"] as const;

function AdminDashboard() {
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(ensureAdmin);
  const fetchRegistrations = useServerFn(listRegistrations);
  const updateStatus = useServerFn(setRegistrationStatus);
  const removeRegistration = useServerFn(deleteRegistration);
  const signReceipt = useServerFn(getReceiptUrl);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("all");

  useEffect(() => {
    checkAdmin({ data: undefined })
      .then((result) => setIsAdmin(result.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [checkAdmin]);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["registrations"],
    queryFn: () => fetchRegistrations(),
    enabled: isAdmin === true,
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected" | "pending" }) =>
      updateStatus({ data: input }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      
      if (result.emailSent) {
        toast.success(
          result.registration.status === "approved"
            ? "Status updated and approval email sent! ✅"
            : "Status updated and rejection email sent! ✅"
        );
      } else {
        toast.success(
          `Status updated to ${result.registration.status}. Email delivery will activate once verified. ⚠️`,
          {
            description: "Database updated successfully, but email not sent yet.",
          }
        );
      }
    },
    onError: (error) => {
      toast.error("Could not update this registration.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeRegistration({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      toast.success("Registration deleted.");
    },
    onError: () => toast.error("Could not delete this registration."),
  });

  const stats = useMemo(
    () => ({
      total: registrations.length,
      pending: registrations.filter((r) => r.status === "pending").length,
      approved: registrations.filter((r) => r.status === "approved").length,
      rejected: registrations.filter((r) => r.status === "rejected").length,
    }),
    [registrations],
  );

  const visible = tab === "all" ? registrations : registrations.filter((r) => r.status === tab);

  async function openReceipt(path: string) {
    try {
      const { url } = await signReceipt({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open the receipt.");
    }
  }

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-primary">Access restricted</h1>
        <p className="mt-3 text-sm text-foreground/70">
          This account does not have admin access. Ask an existing CFG administrator to grant you
          access.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black text-primary sm:text-3xl">Registrations</h1>
      <p className="mt-2 text-sm text-foreground/65">
        Verify payment receipts, then approve or reject each participant. Email notifications will be sent automatically.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total" value={stats.total} tone="text-primary" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} tone="text-accent-foreground" />
        <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} tone="text-leaf" />
        <StatCard icon={XCircle} label="Rejected" value={stats.rejected} tone="text-destructive" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-colors ${
              tab === status
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground/70 border border-border"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <p className="card-soft mt-6 p-10 text-center text-sm font-semibold text-foreground/60">
          No registrations in this view yet.
        </p>
      ) : (
        <div className="card-soft mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs font-bold tracking-wider text-primary uppercase">
              <tr>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Guardian</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Health &amp; disability</th>

                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((registration) => (
                <Row
                  key={registration.id}
                  registration={registration}
                  busy={statusMutation.isPending || deleteMutation.isPending}
                  onStatus={(status) => statusMutation.mutate({ id: registration.id, status })}
                  onDelete={() => {
                    if (window.confirm("Delete this registration permanently?")) {
                      deleteMutation.mutate(registration.id);
                    }
                  }}
                  onReceipt={() => registration.receipt_path && openReceipt(registration.receipt_path)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Row({
  registration,
  busy,
  onStatus,
  onDelete,
  onReceipt,
}: {
  registration: Registration;
  busy: boolean;
  onStatus: (status: "approved" | "rejected") => void;
  onDelete: () => void;
  onReceipt: () => void;
}) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <p className="font-bold text-primary">{registration.full_name}</p>
        <p className="text-xs text-foreground/60">
          {registration.gender} · {registration.date_of_birth}
        </p>
        <p className="text-xs text-foreground/60">{registration.school}</p>
      </td>
      <td className="px-4 py-4">
        <p className="font-semibold">{registration.guardian_name}</p>
        <p className="text-xs text-foreground/60">{registration.guardian_phone}</p>
        <p className="text-xs text-foreground/60">SOS: {registration.emergency_contact}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs break-all text-foreground/70">{registration.email}</p>
        <p className="mt-1 text-xs text-foreground/60">{registration.home_address}</p>
      </td>
      <td className="px-4 py-4 max-w-[220px]">
        <p className="text-xs font-bold text-foreground/80">
          Disability: {registration.has_disability ? "Yes" : "No"}
        </p>
        {registration.has_disability && registration.disability_details ? (
          <p className="text-xs text-foreground/60">{registration.disability_details}</p>
        ) : null}
        <p className="mt-1.5 text-xs font-bold text-foreground/80">
          Health condition: {registration.has_health_condition ? "Yes" : "No"}
        </p>
        {registration.has_health_condition && registration.health_condition_details ? (
          <p className="text-xs text-foreground/60">{registration.health_condition_details}</p>
        ) : null}
      </td>

      <td className="px-4 py-4">
        <button
          onClick={onReceipt}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-primary"
        >
          <FileText className="h-3.5 w-3.5" /> View
        </button>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={registration.status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            disabled={busy || registration.status === "approved"}
            onClick={() => onStatus("approved")}
            title="Approve and send confirmation email"
            className="inline-flex items-center gap-1 rounded-full bg-leaf px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40 hover:bg-leaf/90 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            disabled={busy || registration.status === "rejected"}
            onClick={() => onStatus("rejected")}
            title="Reject and send notification email"
            className="inline-flex items-center gap-1 rounded-full border border-destructive px-3 py-1.5 text-xs font-bold text-destructive disabled:opacity-40 hover:bg-destructive/5 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            disabled={busy}
            onClick={onDelete}
            aria-label="Delete registration"
            className="rounded-full border border-border p-1.5 text-foreground/60 disabled:opacity-40 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-accent/20 text-accent-foreground",
    approved: "bg-leaf/15 text-leaf",
    rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[status] ?? "bg-muted"}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="card-soft p-5">
      <span className={`flex items-center gap-2 text-xs font-bold uppercase ${tone}`}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <p className="mt-2 text-3xl font-black text-primary">{value}</p>
    </div>
  );
}
