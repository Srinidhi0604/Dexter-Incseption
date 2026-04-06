"use client";

import { motion } from "framer-motion";
import { Copy, MapPinned, Users, Check, CircleUserRound, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/client-api";
import { getInitials } from "@/lib/utils";
import type { SessionUser } from "@/types";

type ProfileResponse = {
  user: SessionUser;
  stats: {
    missionsCompleted: number;
    issuesReported: number;
    drivesJoined: number;
  };
  badges: any[];
  communitiesJoined: string[];
  recentDrives: any[];
  recentIssues: any[];
};

export default function ProfilePage() {
  const router = useRouter();
  const { token, logout, setSessionUser } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"performance" | "impact">("performance");

  const loadProfile = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiFetch<ProfileResponse>("/api/profile", {
        method: "GET",
        token,
        cache: "no-store",
      });
      setProfile(response);
      setSessionUser(response.user);
    } catch (e) {
      console.error("[profile]", e);
    }
  }, [setSessionUser, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const copyInviteCode = async () => {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.user.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const signOut = () => {
    logout();
    router.replace("/auth");
  };

  if (!profile) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 min-h-screen bg-[#0b0b0b]">
      {/* Header Profile Section */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center pt-6 pb-2"
      >
        <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 font-display text-2xl text-white shadow-lg">
          {getInitials(profile.user.name)}
        </div>
        <h1 className="font-display font-semibold text-2xl text-white tracking-wide">{profile.user.name}</h1>
        <p className="text-sm text-slate-400 mb-4">@{profile.user.name.toLowerCase().replace(/\s+/g, '')}</p>
        
        <div className="flex items-center gap-6 text-sm mb-5">
          <div className="flex flex-col items-center">
            <span className="font-bold text-white">45</span>
            <span className="text-slate-400 text-xs">Followers</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="font-bold text-white">12</span>
            <span className="text-slate-400 text-xs">Following</span>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-6 py-2 text-sm font-medium text-white transition-colors border border-white/5">
          <CircleUserRound className="h-4 w-4" />
          Find friends
        </button>
      </motion.section>

      {/* Community Card */}
      <Card className="bg-[#1a1a1a] border-white/5 mx-4 p-4 rounded-3xl flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
          <Users className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-medium text-lg">Community</h2>
          <p className="text-slate-400 text-sm">Join groups & meet people</p>
        </div>
      </Card>

      {/* Invitation Code */}
      <Card className="bg-gradient-to-r from-[#1a1a1a] to-slate-900 border-white/5 mx-4 overflow-hidden rounded-3xl p-5 relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="h-20 w-20 text-sky-400" />
        </div>
        <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold font-display">
          Invitation Code
        </h3>
        <div className="flex items-center justify-between mt-2">
          <p className="font-display text-2xl tracking-wider text-white font-medium">{profile.user.inviteCode}</p>
          <button
            type="button"
            onClick={copyInviteCode}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs text-white hover:bg-white/15 transition-colors backdrop-blur-md"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mx-4 flex items-center p-1 rounded-2xl bg-white/5 border border-white/5">
        <button
          onClick={() => setActiveTab("performance")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${activeTab === "performance" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab("impact")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${activeTab === "impact" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}
        >
          Impact
        </button>
      </div>

      {/* Stats Area */}
      {activeTab === "performance" && (
        <div className="mx-4 grid grid-cols-2 gap-3 mb-20 pb-4">
          <Card className="bg-[#1a1a1a] border-white/5 rounded-3xl p-5">
            <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Days</h4>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-display font-medium text-white">{profile.user.streak}</span>
              <span className="text-slate-500 text-sm mb-1 pb-0.5">streak</span>
            </div>
          </Card>
          
          <Card className="bg-[#1a1a1a] border-white/5 rounded-3xl p-5">
            <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">XP</h4>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-display font-medium text-amber-400">{profile.user.xp}</span>
              <span className="text-slate-500 text-sm mb-1 pb-0.5">pts</span>
            </div>
          </Card>

          <Card className="bg-[#1a1a1a] border-white/5 rounded-3xl p-5 col-span-2 flex justify-between items-center">
            <div>
              <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-1">Seeds</h4>
              <p className="text-2xl font-display font-medium text-emerald-400">0 <span className="text-sm text-slate-500 font-sans">balance</span></p>
            </div>
            <div className="h-12 w-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
              <span className="text-xl">??</span>
            </div>
          </Card>
        </div>
      )}

      {/* Log out at the bottom */}
      <div className="mx-4 text-center mt-6 mb-20 cursor-pointer text-sm text-slate-500 hover:text-white transition-colors" onClick={signOut}>
        Log out
      </div>

    </div>
  );
}
