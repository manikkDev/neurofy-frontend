type SeverityLevel = "high" | "medium" | "low" | "none";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: "sm" | "md" | "lg";
}

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bg: string }> = {
  high: {
    label: "High",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
  },
  low: {
    label: "Low",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
  },
  none: {
    label: "None",
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
  },
};

export function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];
  const padding = size === "lg" ? "px-4 py-2" : size === "md" ? "px-3 py-1.5" : "px-2 py-1";
  const textSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center ${padding} rounded-full border ${config.bg} ${config.color} ${textSize} font-semibold`}
    >
      {config.label}
    </span>
  );
}
