import { cn } from "@/lib/utils";

export function ProgressRing({
  progress,
  size = 110,
  stroke = 8,
  label,
  subLabel,
  className,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  subLabel?: string;
  className?: string;
}) {
  const normalized = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference - (normalized / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#civicPulseGradient)"
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="civicPulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-xl text-white">{label}</p>
        {subLabel ? <p className="text-[11px] text-slate-400">{subLabel}</p> : null}
      </div>
    </div>
  );
}
