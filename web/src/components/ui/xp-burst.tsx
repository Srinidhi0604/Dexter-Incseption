"use client";

import { AnimatePresence, motion } from "framer-motion";

type RewardEvent = {
  id: number;
  xp: number;
  label?: string;
};

export function XpBurst({ event }: { event: RewardEvent | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center">
      <AnimatePresence>
        {event ? (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 1.05 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="rounded-2xl border border-amber-300/30 bg-amber-300/20 px-4 py-2 text-sm font-semibold text-amber-100 shadow-lg"
          >
            +{event.xp} XP {event.label ? `• ${event.label}` : ""}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
