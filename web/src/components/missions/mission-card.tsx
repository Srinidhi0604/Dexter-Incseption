"use client";

import { motion } from "framer-motion";
import { Clock3, Gift } from "lucide-react";

import { MissionIcon } from "@/components/missions/mission-icon";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { MissionItem } from "@/types";

function formatCountdown(minutes: number) {
  if (minutes >= 1440) {
    return `${Math.round(minutes / 1440)} day window`;
  }
  if (minutes >= 60) {
    return `${Math.round(minutes / 60)} hour window`;
  }
  return `${minutes} min window`;
}

export function MissionCard({
  mission,
  onComplete,
  completing,
}: {
  mission: MissionItem;
  onComplete: (mission: MissionItem) => void;
  completing: boolean;
}) {
  const progress = Math.min(100, (mission.completedCount / mission.targetCount) * 100);
  const isCompleted = mission.completedCount >= mission.targetCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15">
            <MissionIcon icon={mission.icon} />
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-amber-200">
              <Gift className="h-3.5 w-3.5" /> +{mission.xpValue} XP
            </div>
          </div>
        </div>

        <div>
          <p className="font-medium text-white">{mission.title}</p>
          <p className="mt-1 text-sm text-slate-400">{mission.description}</p>
        </div>

        <div>
          <ProgressBar value={progress} />
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>
              {mission.completedCount}/{mission.targetCount} completed
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatCountdown(mission.countdownMins)}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isCompleted || completing}
          onClick={() => onComplete(mission)}
          className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isCompleted ? "Completed" : completing ? "Updating..." : "Complete mission"}
        </button>
      </Card>
    </motion.div>
  );
}
