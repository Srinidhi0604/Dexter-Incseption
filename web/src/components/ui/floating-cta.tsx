"use client";

import { Plus } from "lucide-react";

export function FloatingCTA({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-28 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
