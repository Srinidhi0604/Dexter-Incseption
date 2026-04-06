"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Heart,
  MapPin,
  MessageCircle,
  Trophy,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { FloatingCTA } from "@/components/ui/floating-cta";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { XpBurst } from "@/components/ui/xp-burst";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/client-api";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import type { FeedPostPayload, SessionUser } from "@/types";

type DriveItem = {
  id: string;
  title: string;
  description: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  date: string;
  ward: string;
  participantsCount: number;
  joined: boolean;
  checkedIn: boolean;
};

type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  ward: string;
  xp: number;
  level: number;
  streak: number;
  impactScore: number;
};

export default function CommunityPage() {
  const { token, setSessionUser, user } = useAuth();

  const [tab, setTab] = useState<"Feed" | "Drives" | "Leaderboard">("Feed");
  const [feed, setFeed] = useState<FeedPostPayload[]>([]);
  const [drives, setDrives] = useState<DriveItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardScope, setLeaderboardScope] = useState<"ward" | "friends">("ward");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [rewardEvent, setRewardEvent] = useState<{ id: number; xp: number; label?: string } | null>(
    null,
  );

  const [showDriveForm, setShowDriveForm] = useState(false);
  const [newDrive, setNewDrive] = useState({
    title: "",
    description: "",
    locationLabel: "",
    latitude: 12.9716,
    longitude: 77.5946,
    ward: user?.ward ?? "Ward-7",
    date: "",
  });

  const triggerReward = useCallback((xp: number, label?: string) => {
    const id = Date.now();
    setRewardEvent({ id, xp, label });
    setTimeout(() => {
      setRewardEvent((current) => (current?.id === id ? null : current));
    }, 1100);
  }, []);

  const loadCore = useCallback(async () => {
    if (!token) {
      return;
    }

    const [feedResponse, driveResponse, boardResponse] = await Promise.all([
      apiFetch<{ posts: FeedPostPayload[] }>("/api/feed", {
        method: "GET",
        token,
        cache: "no-store",
      }),
      apiFetch<{ drives: DriveItem[] }>("/api/drives", {
        method: "GET",
        token,
        cache: "no-store",
      }),
      apiFetch<{ leaderboard: LeaderboardEntry[] }>(
        `/api/leaderboard?scope=${leaderboardScope}`,
        {
          method: "GET",
          token,
          cache: "no-store",
        },
      ),
    ]);

    setFeed(feedResponse.posts);
    setDrives(driveResponse.drives);
    setLeaderboard(boardResponse.leaderboard);
  }, [leaderboardScope, token]);

  useEffect(() => {
    loadCore().catch((error) => {
      console.error("[community]", error);
    });
  }, [loadCore]);

  const refreshLeaderboard = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await apiFetch<{ leaderboard: LeaderboardEntry[] }>(
      `/api/leaderboard?scope=${leaderboardScope}`,
      {
        method: "GET",
        token,
        cache: "no-store",
      },
    );

    setLeaderboard(response.leaderboard);
  }, [leaderboardScope, token]);

  useEffect(() => {
    refreshLeaderboard().catch((error) => {
      console.error("[leaderboard]", error);
    });
  }, [refreshLeaderboard]);

  const likePost = async (postId: string) => {
    if (!token) {
      return;
    }

    const response = await apiFetch<{ liked: boolean; likesCount: number }>(
      `/api/feed/${postId}/like`,
      {
        method: "POST",
        token,
      },
    );

    setFeed((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              hasLiked: response.liked,
              likesCount: response.likesCount,
            }
          : post,
      ),
    );
  };

  const addComment = async (postId: string) => {
    if (!token || !commentDrafts[postId]?.trim()) {
      return;
    }

    const response = await apiFetch<{
      comment: FeedPostPayload["comments"][number];
      commentsCount: number;
    }>(`/api/feed/${postId}/comment`, {
      method: "POST",
      token,
      body: {
        content: commentDrafts[postId],
      },
    });

    setFeed((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentsCount: response.commentsCount,
              comments: [...post.comments, response.comment].slice(-3),
            }
          : post,
      ),
    );

    setCommentDrafts((current) => ({
      ...current,
      [postId]: "",
    }));
  };

  const createDrive = async () => {
    if (!token || !newDrive.date || !newDrive.title || !newDrive.locationLabel) {
      return;
    }

    const response = await apiFetch<{ drive: DriveItem }>("/api/drives", {
      method: "POST",
      token,
      body: {
        ...newDrive,
        date: new Date(newDrive.date).toISOString(),
      },
    });

    setDrives((current) => [
      {
        ...response.drive,
        participantsCount: 1,
        joined: true,
        checkedIn: false,
      },
      ...current,
    ]);
    setShowDriveForm(false);
    setNewDrive((current) => ({
      ...current,
      title: "",
      description: "",
      locationLabel: "",
      date: "",
    }));
  };

  const joinDrive = async (driveId: string) => {
    if (!token) {
      return;
    }

    const response = await apiFetch<{
      joined: boolean;
      alreadyJoined?: boolean;
      reward?: {
        xpGained: number;
        user: SessionUser;
      } | null;
    }>(`/api/drives/${driveId}/join`, {
      method: "POST",
      token,
    });

    setDrives((current) =>
      current.map((drive) =>
        drive.id === driveId
          ? {
              ...drive,
              joined: true,
              participantsCount: drive.participantsCount + (response.alreadyJoined ? 0 : 1),
            }
          : drive,
      ),
    );

    if (response.reward?.user) {
      setSessionUser(response.reward.user);
      triggerReward(response.reward.xpGained, "Drive joined");
      refreshLeaderboard().catch(() => {});
    }
  };

  const checkInDrive = async (driveId: string) => {
    if (!token) {
      return;
    }

    await apiFetch<{ checkedIn: boolean }>(`/api/drives/${driveId}/checkin`, {
      method: "POST",
      token,
    });

    setDrives((current) =>
      current.map((drive) =>
        drive.id === driveId
          ? {
              ...drive,
              checkedIn: true,
            }
          : drive,
      ),
    );
  };

  const sortedDrives = useMemo(
    () => [...drives].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [drives],
  );

  return (
    <div className="space-y-4 pb-2">
      <XpBurst event={rewardEvent} />

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Community loop</p>
        <h1 className="font-display text-2xl text-white">Social reinforcement</h1>
        <p className="mt-1 text-sm text-slate-400">
          Celebrate actions, team up on local drives, and climb your ward leaderboard.
        </p>
        <div className="mt-4">
          <SegmentedTabs
            options={["Feed", "Drives", "Leaderboard"]}
            value={tab}
            onChange={(nextTab) => setTab(nextTab)}
          />
        </div>
      </Card>

      {tab === "Feed" ? (
        <div className="space-y-3">
          {feed.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card>
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-xs font-semibold text-sky-200">
                      {getInitials(post.user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{post.user.name}</p>
                      <p className="text-xs text-slate-400">
                        {post.user.ward} • {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-300/30 px-2 py-0.5 text-[11px] text-amber-200">
                    +{post.xpEarned} XP
                  </span>
                </div>

                <p className="text-sm text-slate-200">{post.content}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => likePost(post.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <Heart className={`h-3.5 w-3.5 ${post.hasLiked ? "text-rose-300" : "text-slate-300"}`} />
                    {post.likesCount}
                  </button>
                  <div className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-2.5 py-1.5 text-xs text-slate-300">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.commentsCount}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {post.comments.map((comment) => (
                    <p key={comment.id} className="text-xs text-slate-300">
                      <span className="font-semibold text-slate-100">{comment.user.name}: </span>
                      {comment.content}
                    </p>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={commentDrafts[post.id] ?? ""}
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [post.id]: event.target.value,
                      }))
                    }
                    placeholder="Add comment"
                    className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addComment(post.id)}
                    className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950"
                  >
                    Post
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}

      {tab === "Drives" ? (
        <div className="space-y-3">
          {showDriveForm ? (
            <Card>
              <p className="mb-2 text-sm font-semibold text-white">Create drive</p>
              <div className="space-y-2">
                <input
                  placeholder="Drive title"
                  value={newDrive.title}
                  onChange={(event) =>
                    setNewDrive((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-200"
                />
                <textarea
                  placeholder="Description"
                  value={newDrive.description}
                  onChange={(event) =>
                    setNewDrive((current) => ({ ...current, description: event.target.value }))
                  }
                  className="h-20 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-200"
                />
                <input
                  placeholder="Location"
                  value={newDrive.locationLabel}
                  onChange={(event) =>
                    setNewDrive((current) => ({ ...current, locationLabel: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-200"
                />
                <input
                  type="datetime-local"
                  value={newDrive.date}
                  onChange={(event) =>
                    setNewDrive((current) => ({ ...current, date: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-200"
                />
                <button
                  type="button"
                  onClick={createDrive}
                  className="w-full rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950"
                >
                  Publish drive
                </button>
              </div>
            </Card>
          ) : null}

          {sortedDrives.map((drive) => (
            <Card key={drive.id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{drive.title}</p>
                  <p className="text-sm text-slate-400">{drive.description}</p>
                </div>
                <div className="rounded-xl border border-white/15 px-2 py-1 text-xs text-slate-300">
                  {drive.ward}
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <p className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-sky-300" />
                  {drive.locationLabel}
                </p>
                <p className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-amber-300" />
                  {new Date(drive.date).toLocaleString()}
                </p>
                <p className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-emerald-300" />
                  {drive.participantsCount} participants
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {drive.joined ? (
                  <button
                    type="button"
                    disabled={drive.checkedIn}
                    onClick={() => checkInDrive(drive.id)}
                    className="rounded-xl border border-emerald-300/40 bg-emerald-300/12 px-3 py-1.5 text-xs font-medium text-emerald-200 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {drive.checkedIn ? "Checked in" : "Check in"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => joinDrive(drive.id)}
                    className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                  >
                    Join drive (+30 XP)
                  </button>
                )}
                <a
                  href={`https://maps.google.com/?q=${drive.latitude},${drive.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/20 px-3 py-1.5 text-xs text-slate-200"
                >
                  Open map
                </a>
              </div>
            </Card>
          ))}

          <FloatingCTA
            label={showDriveForm ? "Close form" : "Create drive"}
            onClick={() => setShowDriveForm((current) => !current)}
          />
        </div>
      ) : null}

      {tab === "Leaderboard" ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leaderboard</p>
            <Trophy className="h-4 w-4 text-amber-300" />
          </div>

          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLeaderboardScope("ward")}
              className={`rounded-xl px-3 py-1.5 text-xs ${
                leaderboardScope === "ward"
                  ? "bg-sky-500 text-slate-950"
                  : "border border-white/15 text-slate-300"
              }`}
            >
              Ward
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardScope("friends")}
              className={`rounded-xl px-3 py-1.5 text-xs ${
                leaderboardScope === "friends"
                  ? "bg-sky-500 text-slate-950"
                  : "border border-white/15 text-slate-300"
              }`}
            >
              Friends
            </button>
          </div>

          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg text-slate-200">#{entry.rank}</p>
                  <div>
                    <p className="text-sm font-medium text-white">{entry.name}</p>
                    <p className="text-xs text-slate-400">
                      {entry.ward} • Lv {entry.level} • {entry.streak}d streak
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-200">{entry.xp} XP</p>
                  <p className="text-xs text-slate-400">Impact {entry.impactScore}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
