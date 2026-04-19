/**
 * Phase 5 – Doctor Patient Detail (Complete)
 *
 * Clinical view with:
 * - Patient info + device status
 * - Live telemetry (from serial pipeline via useLiveTelemetry)
 * - Stats row
 * - Frequency trend chart + daily episode count chart
 * - Full episode history table
 * - Notes section with add-note form (content + diagnosis)
 * - Reports section with create-report form
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { doctorApi, type PatientDetailData } from "@/services/api/doctorApi";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { storage } from "@/lib/storage";

// ── Shared small sub-components ──────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-200">{value}</p>
    </div>
  );
}

// ── Add Note Form ────────────────────────────────────────────────────

function AddNoteForm({
  patientId,
  onSuccess,
}: {
  patientId: string;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!content.trim()) { setErr("Note content is required"); return; }
    try {
      setSubmitting(true);
      setErr(null);
      const token = storage.getToken();
      if (!token) return;
      const res = await doctorApi.createNote(patientId, { content, diagnosis: diagnosis || undefined, isPrivate }, token);
      if (res.success) {
        setContent(""); setDiagnosis(""); setIsPrivate(false);
        onSuccess();
      }
    } catch (e: any) {
      setErr(e.message || "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-surface-overlay rounded-xl border border-surface-border space-y-3">
      <p className="text-sm font-semibold text-white">Add Clinical Note</p>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Clinical observations, treatment plan, next steps…"
        className="w-full px-3 py-2.5 rounded-lg bg-surface-raised border border-surface-border text-gray-200 text-sm focus:outline-none focus:border-brand-500 resize-none"
      />
      <input
        type="text"
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        placeholder="Diagnosis summary (optional)"
        className="w-full px-3 py-2.5 rounded-lg bg-surface-raised border border-surface-border text-gray-200 text-sm focus:outline-none focus:border-brand-500"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded"
          />
          Private (hidden from patient)
        </label>
        <button
          onClick={submit}
          disabled={submitting || !content.trim()}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Note"}
        </button>
      </div>
    </div>
  );
}

// ── Create Report Form ───────────────────────────────────────────────

function CreateReportForm({
  patientId,
  onSuccess,
}: {
  patientId: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"draft" | "completed">("completed");
  const [period, setPeriod] = useState<"none" | "daily" | "weekly">("weekly");
  const [submitting, setSubmitting] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadPeriodSummary = async (p: "daily" | "weekly") => {
    try {
      setLoadingSummary(true);
      setErr(null);
      const token = storage.getToken();
      if (!token) return;
      const res = await doctorApi.getReportPeriodSummary(patientId, p, token);
      if (res.success && res.data) {
        const s = res.data;
        const periodLabel = p === "daily" ? "Today" : "Past 7 Days";
        const autoTitle = `${periodLabel === "Today" ? "Daily" : "Weekly"} Clinical Report – ${new Date().toLocaleDateString()}`;
        const totalMin = Math.round(s.totalDurationSeconds / 60);
        const autoSummary = [
          `Report Period: ${periodLabel}`,
          ``,
          `Total tremor episodes recorded: ${s.totalEpisodes}`,
          `Severity breakdown: ${s.severityBreakdown.severe} severe, ${s.severityBreakdown.moderate} moderate, ${s.severityBreakdown.mild} mild.`,
          `Dominant severity during this period: ${s.dominantSeverity}.`,
          `Total tremor duration: ~${totalMin} minute${totalMin !== 1 ? "s" : ""}.`,
          `Average dominant frequency: ${s.averageFrequency.toFixed(2)} Hz.`,
          ``,
          `Clinical observations: [please add specific observations, treatment changes, and recommendations]`,
        ].join("\n");
        if (!title.trim()) setTitle(autoTitle);
        if (!summary.trim()) setSummary(autoSummary);
      }
    } catch (e: any) {
      setErr(e.message || "Failed to load period summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !summary.trim()) { setErr("Title and summary are required"); return; }
    try {
      setSubmitting(true);
      setErr(null);
      const token = storage.getToken();
      if (!token) return;
      const res = await doctorApi.createReport(
        patientId,
        { title, summary, status, period: period === "none" ? undefined : period },
        token
      );
      if (res.success) {
        setTitle(""); setSummary(""); setStatus("completed"); setPeriod("weekly");
        onSuccess();
      }
    } catch (e: any) {
      setErr(e.message || "Failed to create report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-surface-overlay rounded-xl border border-surface-border space-y-3">
      <p className="text-sm font-semibold text-white">Generate Report</p>
      {err && <p className="text-xs text-red-400">{err}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-gray-400">Period:</label>
        <div className="flex gap-1 bg-surface-raised rounded-lg p-1 border border-surface-border">
          {([
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "none", label: "Freeform" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                period === opt.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {period !== "none" && (
          <button
            type="button"
            onClick={() => loadPeriodSummary(period)}
            disabled={loadingSummary}
            className="px-3 py-1 text-xs rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 hover:bg-brand-500/20 transition-colors disabled:opacity-50"
          >
            {loadingSummary ? "Loading…" : "Auto-fill from period stats"}
          </button>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Report title (e.g. Weekly Clinical Report – March 2026)"
        className="w-full px-3 py-2.5 rounded-lg bg-surface-raised border border-surface-border text-gray-200 text-sm focus:outline-none focus:border-brand-500"
      />
      <textarea
        rows={6}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Report summary and clinical findings…"
        className="w-full px-3 py-2.5 rounded-lg bg-surface-raised border border-surface-border text-gray-200 text-sm focus:outline-none focus:border-brand-500 resize-y font-mono"
      />
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">
          Status:{" "}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="ml-2 bg-surface-raised border border-surface-border text-gray-200 text-xs rounded px-2 py-1"
          >
            <option value="completed">Completed (visible to patient)</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <button
          onClick={submit}
          disabled={submitting || !title.trim() || !summary.trim()}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Report"}
        </button>
      </div>
    </div>
  );
}

// ── Chart helpers ────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1a1a2e",
    border: "1px solid #2a2a3a",
    borderRadius: 8,
    color: "#e5e7eb",
  },
};

function FrequencyTrendChart({ episodes }: { episodes: any[] }) {
  const data = [...episodes]
    .reverse()
    .slice(-20)
    .map((ep) => ({
      date: new Date(ep.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      freq: ep.avgFrequencyHz ? parseFloat(ep.avgFrequencyHz.toFixed(2)) : 0,
    }));

  return (
    <Card>
      <CardHeader title="Frequency Trend" subtitle="Avg Hz per episode" />
      <div className="h-48 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis unit="Hz" tick={{ fill: "#6b7280", fontSize: 10 }} width={45} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v} Hz`, "Frequency"]} />
            <Line type="monotone" dataKey="freq" stroke="#818cf8" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SeverityTrendChart({ episodes }: { episodes: any[] }) {
  const map: Record<string, number> = { MILD: 1, MODERATE: 2, SEVERE: 3 };
  const data = [...episodes]
    .reverse()
    .slice(-20)
    .map((ep) => ({
      date: new Date(ep.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sev: map[ep.maxSeverity] ?? 0,
      label: ep.maxSeverity,
    }));

  return (
    <Card>
      <CardHeader title="Severity Trend" subtitle="1=Mild 2=Moderate 3=Severe" />
      <div className="h-48 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tick={{ fill: "#6b7280", fontSize: 10 }} width={30} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(_v, _n, props) => [props.payload?.label, "Severity"]} />
            <Bar dataKey="sev" radius={[4, 4, 0, 0]} fill="#818cf8"
              // Per-bar color via Cell is not trivial without Cell import; use gradient fill
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function DailyCountChart({ dailyCounts }: { dailyCounts: Array<{ date: string; count: number }> }) {
  const data = dailyCounts.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));
  return (
    <Card>
      <CardHeader title="Daily Episodes (14d)" subtitle="Episode count per day" />
      <div className="h-48 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} interval={1} />
            <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 10 }} width={30} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, "Episodes"]} />
            <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export function DoctorPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<PatientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "reports">("overview");

  // Live telemetry from serial pipeline
  const live = useLiveTelemetry(id);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const token = storage.getToken();
      if (!token) return;
      const res = await doctorApi.getPatientDetail(id, token);
      if (res.success && res.data) setDetail(res.data);
      else setError("Failed to load patient");
    } catch (err: any) {
      setError(err.message || "Failed to load patient details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading clinical data…</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400">{error ?? "Patient not found"}</p>
        <Link to="/doctor/patients" className="text-brand-400 text-xs mt-2 block hover:underline">
          ← Back to patients
        </Link>
      </div>
    );
  }

  const { patient, episodes, stats, notes, reports, device } = detail;
  const { latest, deviceConnected } = live;

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div>
        <Link to="/doctor/patients" className="text-xs text-gray-500 hover:text-brand-400">
          ← Patients
        </Link>
        <h1 className="text-2xl font-bold text-white mt-1">{patient.name}</h1>
        <p className="text-sm text-gray-500">{patient.email}</p>
      </div>

      {/* Patient info + device */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Patient Information" subtitle="Basic clinical record" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <InfoField label="Name" value={patient.name} />
            <InfoField label="Email" value={patient.email} />
            <InfoField
              label="Member Since"
              value={new Date(patient.createdAt).toLocaleDateString()}
            />
            <InfoField label="Status" value={patient.isActive ? "Active" : "Inactive"} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Device" subtitle="Wearable monitor status" />
          <div className="mt-4 space-y-3">
            {device ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      deviceConnected ? "bg-green-400 animate-pulse" : "bg-gray-600"
                    }`}
                  />
                  <span className={`text-sm font-medium ${deviceConnected ? "text-green-400" : "text-gray-500"}`}>
                    {deviceConnected ? "Live — Device Connected" : "Offline"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="Device ID" value={device.deviceId} />
                  <InfoField label="Label" value={device.label} />
                  <InfoField label="Pairing" value={device.pairingStatus} />
                  {device.batteryLevel != null && (
                    <InfoField label="Battery" value={`${device.batteryLevel}%`} />
                  )}
                  {device.lastSyncAt && (
                    <InfoField
                      label="Last Sync"
                      value={new Date(device.lastSyncAt).toLocaleString()}
                    />
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">No device paired to this patient</p>
            )}
          </div>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Episodes", value: stats.totalEpisodes, accent: "text-brand-400" },
          { label: "Severe", value: stats.severityBreakdown.severe, accent: "text-red-400" },
          { label: "Moderate", value: stats.severityBreakdown.moderate, accent: "text-yellow-400" },
          { label: "Mild", value: stats.severityBreakdown.mild, accent: "text-green-400" },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Live monitoring */}
      <Card>
        <CardHeader
          title="Live Monitoring"
          subtitle="Real-time data from patient's wired device"
        />
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2.5 h-2.5 rounded-full ${deviceConnected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
            <span className={`text-sm font-medium ${deviceConnected ? "text-green-400" : "text-gray-500"}`}>
              {deviceConnected ? "ESP32 Connected" : "Device not connected"}
            </span>
          </div>
          {latest ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Status", value: latest.status === "DETECTED" ? "⚠ Tremor" : "✓ Normal",
                  accent: latest.status === "DETECTED" ? "text-red-400" : "text-green-400" },
                { label: "Frequency", value: `${latest.frequencyHz?.toFixed(2) ?? "—"} Hz` },
                { label: "SNR", value: `${latest.snr?.toFixed(1) ?? "—"} dB` },
                { label: "Amplitude", value: `${latest.amplitude?.toFixed(3) ?? "—"} g` },
              ].map((m) => (
                <div key={m.label} className="p-3 bg-surface-overlay rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className={`text-sm font-semibold ${m.accent ?? "text-gray-200"}`}>{m.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">
              No live data — awaiting device connection.
            </p>
          )}
          {latest?.severity && latest.severity !== "NONE" && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Severity:</span>
              <StatusBadge severity={latest.severity as any} label={latest.severity} />
            </div>
          )}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FrequencyTrendChart episodes={episodes} />
        <SeverityTrendChart episodes={episodes} />
      </div>
      <DailyCountChart dailyCounts={stats.dailyCounts} />

      {/* Tabs: Overview / Notes / Reports */}
      <div>
        <div className="flex gap-1 border-b border-surface-border mb-5">
          {(["overview", "notes", "reports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-brand-500 -mb-px"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "notes" ? `Notes (${notes.length})` : tab === "reports" ? `Reports (${reports.length})` : "History"}
            </button>
          ))}
        </div>

        {/* History tab */}
        {activeTab === "overview" && (
          <Card>
            <CardHeader title="Episode History" subtitle={`${episodes.length} recorded episodes`} />
            {episodes.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No episodes recorded</div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border">
                      {["Date", "Severity", "Duration", "Avg Freq", "Max Amp"].map((col) => (
                        <th key={col} className="text-left py-2 px-4 text-xs uppercase tracking-wide text-gray-500 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {episodes.map((ep) => (
                      <tr key={ep._id} className="border-b border-surface-border hover:bg-surface-overlay transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-200">
                          {new Date(ep.startedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge severity={ep.maxSeverity} label={ep.maxSeverity} />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {ep.durationSec ? `${ep.durationSec.toFixed(0)}s` : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {ep.avgFrequencyHz ? `${ep.avgFrequencyHz.toFixed(1)} Hz` : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {ep.maxAmplitude ? `${ep.maxAmplitude.toFixed(3)} g` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Notes tab */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <AddNoteForm patientId={id!} onSuccess={load} />
            {notes.length === 0 ? (
              <Card>
                <div className="text-center py-10 text-gray-500">No notes yet — add the first one above</div>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note._id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {note.diagnosis && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-600/20 text-brand-400 border border-brand-500/30 mb-2 inline-block">
                            {note.diagnosis}
                          </span>
                        )}
                        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Dr. {(note.doctorId as any)?.name ?? "Unknown"}</span>
                          <span>·</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                          {note.isPrivate && <span className="text-yellow-600">Private</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports tab */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <CreateReportForm patientId={id!} onSuccess={load} />
            {reports.length === 0 ? (
              <Card>
                <div className="text-center py-10 text-gray-500">No reports yet — create one above</div>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report._id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-base font-semibold text-white">{report.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            report.status === "completed"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }`}>
                            {report.status}
                          </span>
                          {(report as any).reportPeriod?.label && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/30">
                              {(report as any).reportPeriod.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Generated: {new Date(report.generatedAt).toLocaleDateString()} · By Dr.{" "}
                          {(report.doctorId as any)?.name ?? "Unknown"}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const token = storage.getToken();
                            if (!token) return;
                            const blob = await doctorApi.downloadReportPdf(report._id, token);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `Neurofy_Report_${report._id}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 hover:bg-brand-500/20 transition-colors flex-shrink-0"
                      >
                        ⬇ PDF
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
