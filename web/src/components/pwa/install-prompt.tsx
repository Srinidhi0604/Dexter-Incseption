"use client";

import { useEffect, useState } from "react";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferredPrompt || dismissed) {
    return null;
  }

  const install = async () => {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-sky-400/30 bg-sky-400/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sky-200">Install CivicPulse+</p>
          <p className="text-[11px] text-slate-300">Use it like a native app, even offline.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={install}
            className="rounded-xl bg-sky-400 px-3 py-1.5 text-xs font-semibold text-slate-950"
          >
            Install
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-white/20 px-2 py-1.5 text-xs text-slate-300"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
