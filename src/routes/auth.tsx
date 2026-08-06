import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/cfg-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin sign in — CFG Summer Camp" },
      {
        name: "description",
        content: "Secure sign in for Children Foundation The Gambia camp administrators.",
      },
      { property: "og:title", content: "Admin sign in — CFG Summer Camp" },
      {
        property: "og:description",
        content: "Restricted area for the CFG Summer Camp registration dashboard.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-camp-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card-soft w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <img src={logo.url} alt="CFG logo" className="h-11 w-11" />
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
              CFG Summer Camp
            </p>
            <h1 className="text-xl font-black text-primary">Admin access</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-bold text-foreground/85">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-bold text-foreground/85">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-semibold text-foreground/60">
          Admin accounts are created by the CFG foundation team. Contact an existing administrator if
          you need access.
        </p>


        <Link
          to="/"
          className="mt-6 block text-center text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase"
        >
          Back to website
        </Link>
      </div>
    </div>
  );
}
