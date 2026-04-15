/**
 * Phase 4 – Patient Dashboard (Complete)
 *
 * Combines live serial telemetry (polling + socket) with backend
 * historical summary data for a complete patient experience.
 *
 * Sections:
 *   1. Severe alert modal (takes over screen when SEVERE)
 *   2. Summary stats row (total episodes, last detection, active alerts)
 *   3. Live device + metric cards
 *   4. Frequency / SNR / Amplitude trend charts
 *   5. Recent episodes table
 *   6. Quick actions
 *   7. Serial debug panel (dev only)
 */

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { PatientLiveDeviceSection } from "@/components/live/PatientLiveDeviceSection";
import { useAuth } from "@/features/auth";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { patientMeApi, type DashboardSummary } from "@/services/api/patientMeApi";
import { storage } from "@/lib/storage";
import { SerialDebugPanel } from "@/components/debug/SerialDebugPanel";
import type { LiveTelemetry } from "@/types/domain";

// ------------------------------------------------------------------
// Severity + status helpers
// ------------------------------------------------------------------

const SEVERITY_COLOR: Record<string, string> = {
  MILD: "text-green-400",
  MODERATE: "text-yellow-400",
  SEVERE: "text-red-400",
  NONE: "text-gray-400",
};

const STATUS_TEXT: Record<string, string> = {
  DETECTED: "TREMOR DETECTED",
  CHECKING: "Tremor Confirming…",
  NOT_DETECTED: "No Tremor",
  UNKNOWN: "—",
};

const STATUS_COLOR: Record<string, string> = {
  DETECTED: "text-red-400",
  CHECKING: "text-yellow-400",
  NOT_DETECTED: "text-green-400",
  UNKNOWN: "text-gray-500",
};

function formatTime(date: Date | null): string {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
}

// ------------------------------------------------------------------
// Severe Alert Modal
// ------------------------------------------------------------------

function SevereAlertModal({
  latest,
  onDismiss,
}: {
  latest: LiveTelemetry | null;
  onDismiss: () => void;
}) {
  if (!latest || latest.severity !== "SEVERE") return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-surface-raised border border-red-500/40 rounded-2xl p-6 space-y-4 animate-pulse-slow">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-red-400">Severe Tremor Detected</h2>
          <p className="text-sm text-red-300/80 mt-2">
            A severe tremor episode has been detected. Please stay calm and seek
            assistance if needed.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <p className="text-xs text-red-400/70">Frequency</p>
            <p className="text-lg font-bold text-red-300">
              {latest.frequencyHz?.toFixed(2) ?? "?"} Hz
            </p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <p className="text-xs text-red-400/70">Amplitude</p>
            <p className="text-lg font-bold text-red-300">
              {latest.amplitude?.toFixed(3) ?? "?"} g
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your doctor has been notified of this event.
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-2.5 rounded-lg bg-red-500/20 text-red-300 font-medium border border-red-500/30 hover:bg-red-500/30 transition-colors"
        >
          I'm OK — Dismiss
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-xl font-bold ${accent ?? "text-gray-200"}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

function DeviceStatusCard({ connected }: { connected: boolean }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span
          className={`w-3 h-3 rounded-full flex-shrink-0 ${
            connected ? "bg-green-400 animate-pulse" : "bg-gray-600"
          }`}
        />
        <div>
          <p className="text-xs text-gray-500">Device</p>
          <p className={`text-sm font-semibold ${connected ? "text-green-400" : "text-gray-500"}`}>
            {connected ? "ESP32 Connected" : "Not Connected"}
          </p>
        </div>
      </div>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: string;
}) {
  return (
    <Card>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ?? "text-gray-200"}`}>
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
    </Card>
  );
}

function TrendChart({
  title,
  subtitle,
  data,
  dataKey,
  color,
  unit,
}: {
  title: string;
  subtitle: string;
  data: LiveTelemetry[];
  dataKey: "frequencyHz" | "snr" | "amplitude";
  color: string;
  unit: string;
}) {
  const chartData = data.map((d, i) => ({
    idx: i,
    value: d[dataKey] ?? 0,
    time: d.deviceElapsedTime ?? new Date(d.detectedAt).toLocaleTimeString(),
  }));

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center border border-dashed border-surface-border rounded-lg">
          <p className="text-sm text-gray-600">Waiting for live data…</p>
        </div>
      ) : (
        <div className="h-48 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} unit={unit} width={45} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid #2a2a3a",
                  borderRadius: 8,
                  color: "#e5e7eb",
                }}
                formatter={(v) => [`${Number(v ?? 0).toFixed(2)} ${unit}`, title]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function SeverityBar({ summary }: { summary: DashboardSummary | null }) {
  if (!summary) return null;
  const { severe, moderate, mild } = summary.severityBreakdown;
  const total = severe + moderate + mild;
  if (total === 0) return null;
  const data = [
    { name: "Severe", count: severe, fill: "#ef4444" },
    { name: "Moderate", count: moderate, fill: "#eab308" },
    { name: "Mild", count: mild, fill: "#22c55e" },
  ];
  return (
    <Card>
      <CardHeader title="Severity Distribution" subtitle="All recorded episodes" />
      <div className="h-40 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #2a2a3a",
                borderRadius: 8,
                color: "#e5e7eb",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function EventFeed({ history }: { history: LiveTelemetry[] }) {
  const recent = [...history].reverse().slice(0, 10);
  return (
    <Card>
      <CardHeader title="Live Event Feed" subtitle="Recent serial readings" />
      {recent.length === 0 ? (
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-gray-600">No events yet</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-surface-border">
          {recent.map((ev, i) => (
            <li key={i} className="py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ev.severity === "SEVERE"
                      ? "bg-red-400"
                      : ev.severity === "MODERATE"
                      ? "bg-yellow-400"
                      : "bg-green-400"
                  }`}
                />
                <span className="text-xs text-gray-300">
                  {STATUS_TEXT[ev.status] ?? ev.status} · {ev.frequencyHz?.toFixed(2) ?? "?"} Hz
                  {ev.confirmCount !== undefined && ` · score ${ev.score ?? "?"}`}
                </span>
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {ev.deviceElapsedTime ?? new Date(ev.detectedAt).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecentEpisodes({ summary }: { summary: DashboardSummary | null }) {
  const ep = summary?.lastEpisode;
  if (!ep) {
    return (
      <Card>
        <CardHeader title="Latest Episode" subtitle="Most recent detected episode" />
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">No episodes recorded yet</p>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader title="Latest Episode" subtitle="Most recent detected episode" />
      <div className="mt-3 p-4 bg-surface-overlay rounded-lg border border-surface-border">
        <div className="flex items-center justify-between mb-2">
          <StatusBadge severity={ep.maxSeverity as any} label={ep.maxSeverity} />
          <span className="text-xs text-gray-500">
            {new Date(ep.startedAt).toLocaleString()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-medium text-gray-300">
              {ep.durationSec ? `${ep.durationSec.toFixed(0)}s` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg Frequency</p>
            <p className="text-sm font-medium text-gray-300">
              {ep.avgFrequencyHz ? `${ep.avgFrequencyHz.toFixed(1)} Hz` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Max Amplitude</p>
            <p className="text-sm font-medium text-gray-300">
              {ep.maxAmplitude ? `${ep.maxAmplitude.toFixed(3)} g` : "—"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------
// Main Dashboard
// ------------------------------------------------------------------

export function PatientDashboard() {
  const { user } = useAuth();
  const patientId = user?.id;
  const { latest, history, lastUpdatedAt, liveState, socketConnected, backendAvailable } = useLiveTelemetry(patientId);
  const [alertModalDismissed, setAlertModalDismissed] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Load backend summary
  useEffect(() => {
    const load = async () => {
      try {
        const token = storage.getToken();
        if (!token) return;
        const res = await patientMeApi.getDashboard(token) as any;
        if (res.success) setSummary(res.data);
      } catch {
        // Best-effort — backend might not have data yet
      } finally {
        setSummaryLoading(false);
      }
    };
    load();
    // Refresh every 30s
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Re-show alert modal on new SEVERE event
  useEffect(() => {
    if (latest?.severity === "SEVERE") {
      setAlertModalDismissed(false);
    }
  }, [latest?.detectedAt]);

  const severity = latest?.severity;
  const status = latest?.status;

  return (
    <div className="space-y-5">
      {/* Severe alert modal */}
      {!alertModalDismissed && (
        <SevereAlertModal
          latest={latest}
          onDismiss={() => setAlertModalDismissed(true)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Patient Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user?.name} ·{" "}
          <span className="text-gray-600">Updated {formatTime(lastUpdatedAt)}</span>
        </p>
      </div>

      {/* Summary stats row — from backend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Episodes"
          value={summaryLoading ? "…" : summary?.totalEpisodes ?? 0}
          icon="📊"
          accent="text-brand-400"
        />
        <StatCard
          label="Last Detection"
          value={
            summary?.lastDetectedAt
              ? new Date(summary.lastDetectedAt).toLocaleDateString()
              : "None"
          }
          icon="🕐"
        />
        <StatCard
          label="Active Alerts"
          value={summaryLoading ? "…" : summary?.activeAlerts ?? 0}
          icon="🔔"
          accent={
            (summary?.activeAlerts ?? 0) > 0 ? "text-red-400" : "text-gray-400"
          }
        />
        <StatCard
          label="Today's Episodes"
          value={summaryLoading ? "…" : summary?.recentEpisodes ?? 0}
          icon="📈"
        />
      </div>

      <PatientLiveDeviceSection
        latest={latest}
        liveState={liveState}
        backendAvailable={backendAvailable}
        socketConnected={socketConnected}
        lastUpdatedAt={lastUpdatedAt}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TrendChart
          title="Frequency Trend"
          subtitle="Hz over time"
          data={history}
          dataKey="frequencyHz"
          color="#818cf8"
          unit="Hz"
        />
        <TrendChart
          title="SNR Trend"
          subtitle="Signal quality over time"
          data={history}
          dataKey="snr"
          color="#34d399"
          unit="dB"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TrendChart
          title="Amplitude Trend"
          subtitle="Tremor intensity over time"
          data={history}
          dataKey="amplitude"
          color="#f59e0b"
          unit="g"
        />
        <SeverityBar summary={summary} />
      </div>

      {/* Latest episode + event feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentEpisodes summary={summary} />
        <EventFeed history={history} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" subtitle="Navigate your health records" />
        <div className="flex flex-wrap gap-3 mt-2">
          <a href="/patient/history" className="btn-secondary text-sm">
            View Full History
          </a>
          <a href="/patient/reports" className="btn-secondary text-sm">
            View Reports
          </a>
          <a href="/patient/notes" className="btn-secondary text-sm">
            Doctor Notes
          </a>
          <a href="/patient/appointments" className="btn-secondary text-sm">
            Appointments
          </a>
          <a href="/patient/alerts" className="btn-secondary text-sm">
            View Alerts
          </a>
        </div>
      </Card>

      {/* Dev-only serial debug panel */}
      <SerialDebugPanel />
    </div>
  );
}
