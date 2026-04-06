import {
  AlertTriangle,
  Bike,
  BookOpen,
  CheckCircle2,
  Droplets,
  Trash2,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Bike,
  Zap,
  Droplets,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Users,
  BookOpen,
};

export function MissionIcon({ icon }: { icon: string }) {
  const Icon = iconMap[icon] ?? CheckCircle2;
  return <Icon className="h-5 w-5 text-sky-300" />;
}
