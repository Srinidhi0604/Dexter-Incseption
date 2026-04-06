"use client";

import { motion } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  Clock3,
  MapPinned,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { XpBurst } from "@/components/ui/xp-burst";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/client-api";
import { formatRelativeTime } from "@/lib/utils";
import type { IssuePayload, SessionUser } from "@/types";

type ReportApiResponse = {
  issues: IssuePayload[];
};

const nextStatus: Record<string, "IN_PROGRESS" | "RESOLVED" | null> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportPage() {
  const { token, setSessionUser } = useAuth();

  const [issues, setIssues] = useState<IssuePayload[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [classificationSource, setClassificationSource] = useState<"gemini" | "heuristic" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [rewardEvent, setRewardEvent] = useState<{ id: number; xp: number; label?: string } | null>(
    null,
  );

  const canSubmit = useMemo(
    () =>
      Boolean(
        token && imageUrl && locationLabel && latitude !== null && longitude !== null,
      ),
    [imageUrl, latitude, locationLabel, longitude, token],
  );

  const loadIssues = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await apiFetch<ReportApiResponse>("/api/reports", {
      method: "GET",
      token,
      cache: "no-store",
    });

    setIssues(response.issues);
  }, [token]);

  useEffect(() => {
    loadIssues().catch((error) => {
      console.error("[report]", error);
    });
  }, [loadIssues]);

  const triggerReward = (xp: number, label?: string) => {
    const id = Date.now();
    setRewardEvent({ id, xp, label });
    setTimeout(() => {
      setRewardEvent((current) => (current?.id === id ? null : current));
    }, 1100);
  };

  const autofillLocation = () => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setLatitude(lat);
        setLongitude(lng);
        setLocationLabel(`Lat ${lat}, Lng ${lng}`);
      },
      () => {
        setLocationLabel("Unable to auto-fetch location. Add manually.");
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  };

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await toDataUrl(file);
    setImageUrl(dataUrl);
  };

  const submitIssue = async () => {
    if (!canSubmit || !token || latitude === null || longitude === null) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiFetch<{
        issue: IssuePayload;
        ai: {
          category: string;
          source: "gemini" | "heuristic";
        };
        reward: {
          xpGained: number;
        };
        user: SessionUser;
      }>("/api/reports", {
        method: "POST",
        token,
        body: {
          imageUrl,
          description,
          locationLabel,
          latitude,
          longitude,
        },
      });

      setIssues((current) => [response.issue, ...current]);
      setSessionUser(response.user);
      setClassificationSource(response.ai.source);
      triggerReward(response.reward.xpGained, "Issue report");
    } catch (error) {
      console.error("[report/submit]", error);
    } finally {
      setSubmitting(false);
    }
  };

  const advanceStatus = async (issue: IssuePayload) => {
    if (!token) {
      return;
    }

    const next = nextStatus[issue.status];
    if (!next) {
      return;
    }

    try {
      const response = await apiFetch<{
        issue: IssuePayload;
        reward: null | {
          xpGained: number;
          user: SessionUser;
        };
      }>(`/api/reports/${issue.id}/status`, {
        method: "PATCH",
        token,
        body: {
          status: next,
        },
      });

      setIssues((current) =>
        current.map((item) => (item.id === issue.id ? response.issue : item)),
      );

      if (response.reward?.user) {
        setSessionUser(response.reward.user);
        triggerReward(response.reward.xpGained, "Issue resolved");
      }
    } catch (error) {
      console.error("[report/status]", error);
    }
  };

  return (
    <div className="space-y-4 pb-2">
      <XpBurst event={rewardEvent} />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <Camera className="h-5 w-5 text-sky-300" />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Issue reporting</p>
          </div>
          <h1 className="font-display text-2xl text-white">Report civic issue</h1>
          <p className="mt-1 text-sm text-slate-400">
            Snap, tag, and submit in seconds. Every report adds civic XP.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block rounded-2xl border border-dashed border-white/20 bg-white/5 p-3 text-sm text-slate-300">
              Upload image
              <input type="file" accept="image/*" className="mt-2 block w-full text-xs" onChange={handleImage} />
            </label>

            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Issue preview"
                width={700}
                height={280}
                className="h-36 w-full rounded-2xl object-cover"
              />
            ) : null}

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context (optional)"
              className="h-20 w-full rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
            />

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={autofillLocation}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-3 py-2 text-sm text-slate-200"
              >
                <MapPinned className="h-4 w-4 text-emerald-300" />
                Auto GPS location
              </button>
              <input
                value={locationLabel}
                onChange={(event) => setLocationLabel(event.target.value)}
                placeholder="Location label"
                className="rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={submitIssue}
              disabled={!canSubmit || submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? "Submitting..." : "Submit issue"}
            </button>

            {classificationSource ? (
              <p className="inline-flex items-center gap-1 text-xs text-sky-200">
                <WandSparkles className="h-3.5 w-3.5" />
                Tagged by {classificationSource === "gemini" ? "Gemini" : "heuristic fallback"}
              </p>
            ) : null}
          </div>
        </Card>
      </motion.section>

      <Card>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Ticket timeline</p>
        <div className="space-y-3">
          {issues.length === 0 ? (
            <p className="text-sm text-slate-400">No issues yet. Submit your first report.</p>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">
                      {issue.category.replace("_", " ")} • {issue.locationLabel}
                    </p>
                    <p className="text-xs text-slate-400">{formatRelativeTime(issue.createdAt)}</p>
                  </div>
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-slate-200">
                    {issue.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1">
                  {issue.timeline.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-xs text-slate-300">
                      {entry.status === "RESOLVED" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5 text-amber-300" />
                      )}
                      <span>{entry.note}</span>
                    </div>
                  ))}
                </div>

                {nextStatus[issue.status] ? (
                  <button
                    type="button"
                    onClick={() => advanceStatus(issue)}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-200"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Move to {nextStatus[issue.status]?.replace("_", " ")}
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
