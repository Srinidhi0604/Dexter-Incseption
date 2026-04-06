"use client";

import { motion } from "framer-motion";
import { House, Flag, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "HOME", icon: House },
  { href: "/missions", label: "MISSIONS", icon: Flag },
  { href: "/leaderboard", label: "LEADERBOARD", icon: Trophy },
  { href: "/profile", label: "PROFILE", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md bg-[#121212] rounded-t-3xl border-t border-[#333]">
      <ul className="grid grid-cols-4 px-2 pb-6 pt-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="relative flex justify-center">
              {active && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute top-0 left-1/2 h-1 w-12 -translate-x-1/2 -mt-3 rounded-full bg-[#38bdf8]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 transition-colors",
                  active ? "text-[#38bdf8]" : "text-[#666] hover:text-[#999]"
                )}
              >
                <Icon className={cn("h-6 w-6", active ? "fill-current" : "")} />
                <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
