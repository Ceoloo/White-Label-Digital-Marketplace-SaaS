import {
  Crown,
  Heart,
  ShoppingBag,
  Sparkles,
  Users,
  Award,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the badge `icon` keys from the white-label config to lucide icons.
 * Falls back to a generic Award icon for unknown keys.
 */
const iconMap: Record<string, LucideIcon> = {
  ShoppingBag,
  Heart,
  Crown,
  Users,
  Sparkles,
  Award,
};

export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Award;
  return <Icon className={className} />;
}
