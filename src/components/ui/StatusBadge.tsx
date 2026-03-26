import type { Severity } from "@/types";

const severityStyles: Record<Severity, string> = {
  NONE: "bg-surface-overlay text-gray-400 border-surface-border",
  MILD: "bg-severity-mild/15 text-severity-mild border-severity-mild/30",
  MODERATE:
    "bg-severity-moderate/15 text-severity-moderate border-severity-moderate/30",
  SEVERE: "bg-severity-severe/15 text-severity-severe border-severity-severe/30",
};

interface StatusBadgeProps {
  severity: Severity;
  label?: string;
}

export function StatusBadge({ severity, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityStyles[severity]}`}
    >
      {label || severity}
    </span>
  );
}
