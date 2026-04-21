import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type {
  LiveConnectionState,
  LiveTelemetry,
  PatientLiveDeviceState,
} from "@/types/domain";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeTime(value?: Date | string | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
}

function getConnectionLabel(state: LiveConnectionState, backendAvailable: boolean, socketConnected: boolean) {
  if (!backendAvailable) {
    return { title: "Backend unavailable", subtitle: "Live API cannot be reached", dot: "bg-red-500", text: "text-red-400" };
  }
  if (!socketConnected) {
    return { title: "Socket unavailable", subtitle: "Realtime channel disconnected; polling fallback active", dot: "bg-yellow-400", text: "text-yellow-300" };
  }
  switch (state) {
    case "connected_active":
      return { title: "Connected and receiving", subtitle: "ESP32 data stream is actively updating", dot: "bg-green-400 animate-pulse", text: "text-green-400" };
    case "connected_idle":
      return { title: "Connected but idle", subtitle: "Port is open but no fresh data arrived recently", dot: "bg-amber-400", text: "text-amber-300" };
    case "disconnected":
      return { title: "Disconnected", subtitle: "Device was seen before but is not currently connected", dot: "bg-gray-500", text: "text-gray-400" };
    case "serial_disabled":
      return { title: "Serial disabled", subtitle: "Backend serial mode is turned off", dot: "bg-gray-600", text: "text-gray-400" };
    case "no_data":
    default:
      return { title: "No data received yet", subtitle: "Waiting for the first reading from the device", dot: "bg-slate-500", text: "text-slate-400" };
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function severityLabel(s?: string): { label: string; color: string; bg: string } {
  switch (s) {
    case "SEVERE":
      return { label: "Severe", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" };
    case "MODERATE":
      return { label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30" };
    case "MILD":
      return { label: "Mild", color: "text-green-400", bg: "bg-green-500/15 border-green-500/30" };
    default:
      return { label: "None", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" };
  }
}

/* ------------------------------------------------------------------ */
/*  Gauge-bar helper                                                   */
/* ------------------------------------------------------------------ */

function GaugeBar({
  value,
  min,
  max,
  stops,
}: {
  value: number;
  min: number;
  max: number;
  stops: { pct: number; color: string }[];
}) {
  const pct = clamp(((value - min) / (max - min)) * 100, 0, 100);
  const gradient = stops.map((s) => `${s.color} ${s.pct}%`).join(", ");

  return (
    <div className="relative w-full h-2 rounded-full overflow-hidden bg-white/5 mt-3">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: "100%", background: `linear-gradient(90deg, ${gradient})` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg shadow-black/50"
        style={{ left: `calc(${pct}% - 6px)`, background: "#fff" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Big metric card (like the reference image)                         */
/* ------------------------------------------------------------------ */

function BigMetric({
  title,
  value,
  unit,
  description,
  gauge,
}: {
  title: string;
  value: string;
  unit: string;
  description: string;
  gauge?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5 flex flex-col justify-between min-h-[170px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
        <p className="text-4xl font-bold text-white leading-none">
          {value}
          <span className="ml-1.5 text-base font-normal text-gray-500">{unit}</span>
        </p>
      </div>
      {gauge}
      <p className="text-[11px] text-gray-500 mt-3 leading-snug">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small info card                                                    */
/* ------------------------------------------------------------------ */

function InfoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function PatientLiveDeviceSection({
  latest,
  history,
  liveState,
  backendAvailable,
  socketConnected,
  lastUpdatedAt,
}: {
  latest: LiveTelemetry | null;
  history: LiveTelemetry[];
  liveState: PatientLiveDeviceState | null;
  backendAvailable: boolean;
  socketConnected: boolean;
  lastUpdatedAt: Date | null;
}) {
  const connection = liveState?.connection;
  const label = getConnectionLabel(connection?.state ?? "no_data", backendAvailable, socketConnected);
  const sev = severityLabel(latest?.severity);

  // Chart data
  const freqData = useMemo(
    () =>
      history.map((h) => ({
        time: new Date(h.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        freq: h.frequencyHz ?? 0,
      })),
    [history]
  );
  const ampData = useMemo(
    () =>
      history.map((h) => ({
        time: new Date(h.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        amp: h.amplitude ?? 0,
      })),
    [history]
  );

  const freq = latest?.frequencyHz ?? 0;
  const amp = latest?.amplitude ?? 0;
  const snr = latest?.snr ?? 0;

  return (
    <div className="space-y-4">
      {/* ── Connection status bar ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${label.dot}`} />
          <div>
            <p className={`text-sm font-semibold ${label.text}`}>{label.title}</p>
            <p className="text-xs text-gray-500">{label.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>Device <span className="text-gray-300 font-medium">{liveState?.device.deviceId ?? "—"}</span></span>
          <span>Transport <span className="text-gray-300 font-medium">{liveState?.device.transportType === "wifi" ? "WiFi" : liveState?.connection.serialEnabled ? "Serial" : "—"}</span></span>
          <span>Last sync <span className="text-gray-300 font-medium">{formatRelativeTime(lastUpdatedAt ?? liveState?.device.lastSyncAt)}</span></span>
        </div>
      </div>

      {/* ── 3 big metric cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BigMetric
          title="Tremor Frequency"
          value={freq > 0 ? freq.toFixed(1) : "—"}
          unit="Hz"
          description="How fast the tremor oscillates. Clinical tremors are typically 4–8 Hz."
          gauge={
            <GaugeBar
              value={freq}
              min={0}
              max={12}
              stops={[
                { pct: 0, color: "#22c55e" },
                { pct: 33, color: "#facc15" },
                { pct: 66, color: "#f97316" },
                { pct: 100, color: "#ef4444" },
              ]}
            />
          }
        />
        <BigMetric
          title="Movement Intensity"
          value={amp > 0 ? amp.toFixed(3) : "—"}
          unit="g"
          description="How strong the tremor movement is. Higher values indicate more intense shaking."
          gauge={
            <GaugeBar
              value={amp}
              min={0}
              max={1}
              stops={[
                { pct: 0, color: "#22c55e" },
                { pct: 40, color: "#facc15" },
                { pct: 70, color: "#f97316" },
                { pct: 100, color: "#ef4444" },
              ]}
            />
          }
        />
        <BigMetric
          title="Signal Quality (SNR)"
          value={snr > 0 ? snr.toFixed(1) : "—"}
          unit="×"
          description="How clearly the tremor signal stands out from normal movement. Values above 3.5× are considered reliable."
          gauge={
            <GaugeBar
              value={snr}
              min={0}
              max={15}
              stops={[
                { pct: 0, color: "#ef4444" },
                { pct: 25, color: "#f97316" },
                { pct: 50, color: "#facc15" },
                { pct: 100, color: "#22c55e" },
              ]}
            />
          }
        />
      </div>

      {/* ── Status row: Detection | Severity | Score | Confirm ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard title="Detection Status">
          <p className="text-lg font-bold text-white">
            {latest?.status === "DETECTED"
              ? "Tremor Detected"
              : latest?.status === "CHECKING"
              ? "Analyzing Movement"
              : latest?.status === "NOT_DETECTED"
              ? "No Tremor"
              : "Waiting…"}
          </p>
        </InfoCard>

        <InfoCard title="Severity">
          <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${sev.bg} ${sev.color}`}>
            {sev.label}
          </span>
        </InfoCard>

        <InfoCard title="Validation Score">
          <p className="text-lg font-bold text-white">
            {latest?.score !== undefined && latest?.score !== null ? `${latest.score}/12` : "—/12"}
            <span className="ml-2 text-sm font-normal text-gray-500">rules</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {latest?.score !== undefined ? `${latest.score >= 10 ? "✓ Passed" : `${10 - (latest.score ?? 0)} more needed`}` : ""}
          </p>
        </InfoCard>

        <InfoCard title="Confirm Count">
          <p className="text-lg font-bold text-white">
            {latest?.confirmCount ?? 0}
            <span className="ml-1 text-sm font-normal text-gray-500">/ 4 needed</span>
          </p>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < (latest?.confirmCount ?? 0) ? "bg-green-400" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </InfoCard>
      </div>

      {/* ── Charts: Frequency & Amplitude over time ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Frequency over time */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Frequency Over Time</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Track how your tremor frequency changes. Stable readings within 4–8 Hz suggest consistent tremor behavior.
              </p>
            </div>
          </div>
          {freqData.length < 2 ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-gray-500">
              Waiting for data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={freqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#555"
                  tick={{ fontSize: 10 }}
                  domain={[2, 10]}
                  tickFormatter={(v: number) => `${v} Hz`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: 12 }}
                  labelStyle={{ color: "#888" }}
                />
                <Line type="monotone" dataKey="freq" stroke="#818cf8" strokeWidth={2} dot={{ r: 2, fill: "#818cf8" }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Movement intensity over time */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Movement Intensity</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Track how tremor intensity varies. Spikes may indicate more severe episodes.
              </p>
            </div>
          </div>
          {ampData.length < 2 ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-gray-500">
              Waiting for data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={ampData}>
                <defs>
                  <linearGradient id="ampGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#555"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => `${v}g`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: 12 }}
                  labelStyle={{ color: "#888" }}
                />
                <Area type="monotone" dataKey="amp" stroke="#f59e0b" strokeWidth={2} fill="url(#ampGrad)" dot={{ r: 2, fill: "#f59e0b" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Device status text + recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="Device Status">
          <p className="text-sm text-gray-300 font-medium">{latest?.statusText ?? "Waiting for device messages."}</p>
          {latest?.deviceElapsedTime && (
            <p className="text-xs text-gray-500 mt-2">Device uptime: {latest.deviceElapsedTime}</p>
          )}
        </InfoCard>

        <InfoCard title="Recent Device Activity">
          {(liveState?.recentEvents ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No device events yet.</p>
          ) : (
            <ul className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {(liveState?.recentEvents ?? []).slice(0, 6).map((event, i) => (
                <li key={`${event.ts}-${i}`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{event.message}</p>
                    <p className="text-[10px] text-gray-500">{event.type}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">{formatRelativeTime(event.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
