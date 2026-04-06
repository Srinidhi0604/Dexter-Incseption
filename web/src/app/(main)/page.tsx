"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, Leaf, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { apiFetch } from "@/lib/client-api";
import { compactNumber } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { DashboardPayload } from "@/types";

export default function HomePage() {
  const { token, setSessionUser } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [quickActions, setQuickActions] = useState<
    {
      id: string;
      title: string;
      subtitle: string;
      href: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await apiFetch<
        DashboardPayload & {
          quickActions: {
            id: string;
            title: string;
            subtitle: string;
            href: string;
          }[];
        }
      >("/api/dashboard", {
        method: "GET",
        token,
        cache: "no-store",
      });

      setDashboard(response);
      setQuickActions(response.quickActions);
      setSessionUser(response.user);
    } finally {
      setLoading(false);
    }
  }, [setSessionUser, token]);

  useEffect(() => {
    loadDashboard().catch((error) => {
      console.error("[home]", error);
      setLoading(false);
    });
  }, [loadDashboard]);

  if (loading || !dashboard) {
    return (
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-3xl bg-white/8" />
        <div className="h-28 animate-pulse rounded-3xl bg-white/8" />
        <div className="h-24 animate-pulse rounded-3xl bg-white/8" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden bg-[#1a1a1a] border border-white/5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Daily pulse</p>
              <h1 className="font-display text-2xl text-white">Habit momentum</h1>
              <p className="mt-1 text-sm text-slate-300">{dashboard.impactMessage}</p>
            </div>
            <ProgressRing
              progress={dashboard.dailyCompletion}
              size={90}
              stroke={7}
              label={`${Math.round(dashboard.dailyCompletion)}%`}
              subLabel="Today"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-[#222] p-3 text-center">
              <p className="text-[11px] text-slate-400">XP</p>
              <p className="font-display text-xl text-amber-200">{compactNumber(dashboard.user.xp)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#222] p-3 text-center">
              <p className="text-[11px] text-slate-400">Streak</p>
              <p className="font-display text-xl text-emerald-300">{dashboard.user.streak}d</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#222] p-3 text-center">
              <p className="text-[11px] text-slate-400">Impact</p>
              <p className="font-display text-xl text-sky-300">{dashboard.user.impactScore}</p>
            </div>
          </div>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
      >
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trigger loop</p>
            <Sparkles className="h-4 w-4 text-sky-300" />
          </div>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#1a1a1a] px-3 py-3 transition-colors hover:bg-white/10"
              >
                <div>
                  <p className="font-medium text-white">{action.title}</p>
                  <p className="text-xs text-slate-400">{action.subtitle}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Weekly impact</p>
            <Trophy className="h-4 w-4 text-amber-300" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <Leaf className="h-4 w-4 text-emerald-300" />
                  CO2 saved
                </span>
                <span className="text-emerald-200">{dashboard.weeklyImpact.co2.toFixed(1)} kg</span>
              </div>
              <ProgressBar
                value={Math.min(100, (dashboard.weeklyImpact.co2 / 40) * 100)}
                indicatorClassName="from-emerald-400 to-teal-400"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <Flame className="h-4 w-4 text-amber-300" />
                  Civic points
                </span>
                <span className="text-amber-200">{dashboard.weeklyImpact.civicPoints}</span>
              </div>
              <ProgressBar
                value={Math.min(100, (dashboard.weeklyImpact.civicPoints / 120) * 100)}
                indicatorClassName="from-amber-400 to-orange-400"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-3 text-sm text-slate-300">
              {dashboard.weeklyImpact.actions} actions this week. Keep the loop alive to hold
              your streak and climb the ward board.
            </div>
          </div>
        </Card>
      </motion.section>
    </div>
  );
}
