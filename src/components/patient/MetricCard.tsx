interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function MetricCard({ label, value, unit, icon, color, size = "md" }: MetricCardProps) {
  const textSize = size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-xl";
  const labelSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";

  return (
    <div className="rounded-xl border border-surface-border bg-surface-overlay p-4 hover:border-brand-500/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className={`${labelSize} text-gray-500 font-medium`}>{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className={`${textSize} font-bold ${color || "text-white"}`}>
        {value}
        {unit && <span className="ml-1 text-base font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}
