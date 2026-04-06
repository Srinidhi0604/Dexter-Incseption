"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch, ApiClientError } from "@/lib/client-api";
import type { SessionUser } from "@/types";

type AuthMode = "Login" | "Register";

export default function AuthPage() {
  const router = useRouter();
  const { login, token, bootstrapped } = useAuth();

  const [mode, setMode] = useState<AuthMode>("Login");
  const [name, setName] = useState("Alex Mercer");
  const [email, setEmail] = useState("demo@civicpulse.app");
  const [password, setPassword] = useState("Demo@123");
  const [ward, setWard] = useState("Ward-7");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bootstrapped && token) {
      router.replace("/");
    }
  }, [bootstrapped, router, token]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch<{
        token: string;
        user: SessionUser;
      }>(mode === "Login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body:
          mode === "Login"
            ? { email, password }
            : { name, email, password, ward },
      });

      login(response.token, response.user);
      router.replace("/");
    } catch (apiError) {
      if (apiError instanceof ApiClientError) {
        setError(apiError.message);
      } else {
        setError("Authentication failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#070707] px-4 py-8 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_85%_8%,rgba(251,191,36,0.2),transparent_38%),radial-gradient(circle_at_50%_95%,rgba(16,185,129,0.2),transparent_45%)]" />
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CivicPulse+</p>
            <h1 className="font-display text-2xl text-white">Daily city impact</h1>
          </div>
          <ShieldCheck className="h-6 w-6 text-sky-300" />
        </div>

        <SegmentedTabs
          options={["Login", "Register"]}
          value={mode}
          onChange={(nextMode) => setMode(nextMode)}
        />

        <div className="mt-4 space-y-3">
          {mode === "Register" ? (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm outline-none"
            />
          ) : null}

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm outline-none"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm outline-none"
          />

          {mode === "Register" ? (
            <input
              value={ward}
              onChange={(event) => setWard(event.target.value)}
              placeholder="Ward"
              className="w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm outline-none"
            />
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-45"
          >
            {submitting ? "Please wait..." : mode === "Login" ? "Login" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {error ? <p className="text-xs text-rose-300">{error}</p> : null}

          <div className="rounded-2xl border border-white/10 bg-white/4 p-3 text-xs text-slate-300">
            <p className="mb-1 inline-flex items-center gap-1 font-medium text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Demo credentials
            </p>
            <p>Email: demo@civicpulse.app</p>
            <p>Password: Demo@123</p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
