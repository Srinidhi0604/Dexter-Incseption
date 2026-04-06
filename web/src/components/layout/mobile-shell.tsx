import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Settings } from "lucide-react";
import Image from "next/image";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md bg-[#0b0b0b] text-white">
      <div className="relative flex min-h-dvh flex-col pb-24">
        <header className="sticky top-0 z-20 bg-[#0b0b0b] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 70 L35 30 L50 70 L65 30 L80 70" stroke="url(#paint0_linear)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="paint0_linear" x1="20" y1="50" x2="80" y2="50" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8"/>
                  <stop offset="0.5" stopColor="#4ade80"/>
                  <stop offset="1" stopColor="#fbbf24"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <button className="flex items-center justify-center h-10 w-10 text-white hover:text-slate-300 transition-colors">
            <Settings className="h-6 w-6" />
          </button>
        </header>
        <InstallPrompt />
        <main className="flex-1">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
