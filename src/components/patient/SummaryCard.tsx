import { Card } from "@/components/ui";

interface SummaryCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

export function SummaryCard({ title, subtitle, children, trend }: SummaryCardProps) {
  const trendColor = trend
    ? trend.value > 0
      ? "text-red-400"
      : trend.value < 0
      ? "text-green-400"
      : "text-gray-400"
    : undefined;

  const trendIcon = trend
    ? trend.value > 0
      ? "↑"
      : trend.value < 0
      ? "↓"
      : "→"
    : undefined;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {trend && (
            <div className={`text-right ${trendColor}`}>
              <div className="flex items-center gap-1 text-sm font-medium">
                <span>{trendIcon}</span>
                <span>{Math.abs(trend.value).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-500">{trend.label}</p>
            </div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </Card>
  );
}
