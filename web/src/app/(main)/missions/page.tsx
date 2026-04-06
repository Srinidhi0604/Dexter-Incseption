"use client";

import { motion } from "framer-motion";
import { BookOpenText } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MissionCard } from "@/components/missions/mission-card";
import { Card } from "@/components/ui/card";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { XpBurst } from "@/components/ui/xp-burst";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/client-api";
import type { MissionItem, SessionUser } from "@/types";

type MissionResponse = {
  personal: MissionItem[];
  community: MissionItem[];
};

type LearningResponse = {
  modules: {
    id: string;
    title: string;
    content: string;
    xpReward: number;
    completedToday: boolean;
    quiz: {
      question: string;
      options: string[];
      answer: string;
    };
  }[];
};

export default function MissionsPage() {
  const { token, setSessionUser } = useAuth();

  const [tab, setTab] = useState<"Personal" | "Community">("Personal");
  const [missions, setMissions] = useState<MissionResponse>({
    personal: [],
    community: [],
  });
  const [learning, setLearning] = useState<LearningResponse["modules"]>([]);
  const [rewardEvent, setRewardEvent] = useState<{ id: number; xp: number; label?: string } | null>(
    null,
  );
  const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<Record<string, string>>({});

  const activeMissions = useMemo(
    () => (tab === "Personal" ? missions.personal : missions.community),
    [missions.community, missions.personal, tab],
  );

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    const [missionResponse, learningResponse] = await Promise.all([
      apiFetch<MissionResponse>("/api/missions", {
        method: "GET",
        token,
        cache: "no-store",
      }),
      apiFetch<LearningResponse>("/api/learning", {
        method: "GET",
        token,
        cache: "no-store",
      }),
    ]);

    setMissions(missionResponse);
    setLearning(learningResponse.modules);
  }, [token]);

  useEffect(() => {
    loadData().catch((error) => {
      console.error("[missions]", error);
    });
  }, [loadData]);

  const triggerReward = useCallback((xp: number, label?: string) => {
    const id = Date.now();
    setRewardEvent({ id, xp, label });
    setTimeout(() => {
      setRewardEvent((current) => (current?.id === id ? null : current));
    }, 1100);
  }, []);

  const completeMission = async (mission: MissionItem) => {
    if (!token) {
      return;
    }

    setCompletingMissionId(mission.id);

    try {
      const response = await apiFetch<{
        xpGained: number;
        actionTitle: string;
        user: SessionUser;
      }>("/api/missions/complete", {
        method: "POST",
        token,
        body: {
          actionId: mission.id,
        },
      });

      triggerReward(response.xpGained, mission.missionTrack === "PERSONAL" ? "Personal" : "Community");
      setSessionUser(response.user);

      setMissions((current) => ({
        personal: current.personal.map((item) =>
          item.id === mission.id
            ? { ...item, completedCount: item.completedCount + 1 }
            : item,
        ),
        community: current.community.map((item) =>
          item.id === mission.id
            ? { ...item, completedCount: item.completedCount + 1 }
            : item,
        ),
      }));
    } catch (error) {
      console.error("[missions/complete]", error);
    } finally {
      setCompletingMissionId(null);
    }
  };

  const completeLearning = async (moduleId: string, answer: string) => {
    if (!token) {
      return;
    }

    try {
      const response = await apiFetch<{
        success: boolean;
        alreadyCompletedToday?: boolean;
        xpGained?: number;
        user?: SessionUser;
      }>("/api/learning/complete", {
        method: "POST",
        token,
        body: {
          moduleId,
          answer,
        },
      });

      if (response.alreadyCompletedToday) {
        setQuizFeedback((current) => ({
          ...current,
          [moduleId]: "Already completed for today.",
        }));
        return;
      }

      if (response.user) {
        setSessionUser(response.user);
      }

      setLearning((current) =>
        current.map((item) =>
          item.id === moduleId ? { ...item, completedToday: true } : item,
        ),
      );

      setQuizFeedback((current) => ({
        ...current,
        [moduleId]: "Great answer. XP added.",
      }));

      triggerReward(response.xpGained ?? 0, "Learning");
    } catch {
      setQuizFeedback((current) => ({
        ...current,
        [moduleId]: "Incorrect answer. Try again.",
      }));
    }
  };

  return (
    <div className="space-y-4">
      <XpBurst event={rewardEvent} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mission engine</p>
          <h1 className="font-display text-2xl text-white">Daily actions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Complete tasks, stack streak bonuses, and push your impact score upward.
          </p>
          <div className="mt-4">
            <SegmentedTabs
              options={["Personal", "Community"]}
              value={tab}
              onChange={(nextTab) => setTab(nextTab)}
            />
          </div>
        </Card>
      </motion.div>

      <div className="space-y-3">
        {activeMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            completing={completingMissionId === mission.id}
            onComplete={completeMission}
          />
        ))}
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <BookOpenText className="h-4 w-4 text-emerald-300" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Learning module</p>
        </div>
        <div className="space-y-3">
          {learning.map((module) => (
            <div key={module.id} className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium text-white">{module.title}</p>
                <span className="text-xs text-amber-200">+{module.xpReward} XP</span>
              </div>
              <p className="text-sm text-slate-400">{module.content}</p>
              <p className="mt-2 text-sm text-slate-300">{module.quiz.question}</p>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {module.quiz.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={module.completedToday}
                    onClick={() => completeLearning(module.id, option)}
                    className="rounded-xl border border-white/15 px-3 py-2 text-left text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {quizFeedback[module.id] ? (
                <p className="mt-2 text-xs text-sky-200">{quizFeedback[module.id]}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
