"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { token, bootstrapped } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapped && !token) {
      router.replace("/auth");
    }
  }, [bootstrapped, token, router]);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-cyan-400/30" />
          <p className="text-sm text-slate-300">Syncing your CivicPulse+ session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
