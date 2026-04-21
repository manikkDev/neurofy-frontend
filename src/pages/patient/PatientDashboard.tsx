/**
 * Phase 5 – Complete Patient Dashboard
 *
 * Patient-friendly dashboard with:
 * - Clear device status and connectivity
 * - Daily and weekly summaries with trends
 * - Progress tracking with accessible charts
 * - Patient-friendly severity display (Low/Medium/High)
 * - Helpful empty states
 * - Large readable text for elderly users
 */

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader } from "@/components/ui";
import { PatientLiveDeviceSection } from "@/components/live/PatientLiveDeviceSection";
import { SummaryCard, MetricCard, EmptyState, SeverityBadge } from "@/components/patient";
import { useAuth } from "@/features/auth";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { patientMeApi } from "@/services/api/patientMeApi";
import { storage } from "@/lib/storage";
import { SerialDebugPanel } from "@/components/debug/SerialDebugPanel";
import type { DailySummary, WeeklySummary, LiveTelemetry } from "@/types/domain";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function SevereAlertModal({ latest, onDismiss }: { latest: LiveTelemetry | null; onDismiss: () => void }) {
  if (!latest || latest.severity !== "SEVERE") return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-surface-raised border border-red-500/40 rounded-2xl p-6 space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-red-400">High Severity Tremor Detected</h2>
          <p className="text-sm text-red-300/80 mt-2">
            A high severity tremor episode has been detected. Please stay calm and seek assistance if needed.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <p className="text-xs text-red-400/70">Frequency</p>
            <p className="text-lg font-bold text-red-400">{latest.frequencyHz?.toFixed(1) ?? "—"} Hz</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <p className="text-xs text-red-400/70">Amplitude</p>
            <p className="text-lg font-bold text-red-400">{latest.amplitude?.toFixed(3) ?? "—"} g</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
        >
          I understand
        </button>
      </div>
    </div>
  );
}

export function PatientDashboard() {
  const { user } = useAuth();
  const patientId = user?.id;
  const { latest, history, lastUpdatedAt, liveState, socketConnected, backendAvailable } = useLiveTelemetry(patientId);
  
  const [alertModalDismissed, setAlertModalDismissed] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [summariesLoading, setSummariesLoading] = useState(true);

  // Load daily and weekly summaries
  useEffect(() => {
    const load = async () => {
      try {
        const token = storage.getToken();
        if (!token) return;
        
        const [dailyRes, weeklyRes] = await Promise.all([
          patientMeApi.getDailySummary(token),
          patientMeApi.getWeeklySummary(token),
        ]);
        
        if (dailyRes.success && dailyRes.data) setDailySummary(dailyRes.data);
        if (weeklyRes.success && weeklyRes.data) setWeeklySummary(weeklyRes.data);
      } catch (error) {
        console.error("Failed to load summaries:", error);
      } finally {
        setSummariesLoading(false);
      }
    };
    
    load();
    const id = setInterval(load, 60_000); // Refresh every minute
    return () => clearInterval(id);
  }, []);

  // Re-show alert modal on new SEVERE event
  useEffect(() => {
    if (latest?.severity === "SEVERE") {
      setAlertModalDismissed(false);
    }
  }, [latest?.detectedAt]);

  const currentSeverity = latest?.severity === "SEVERE" ? "high" : latest?.severity === "MODERATE" ? "medium" : latest?.severity === "MILD" ? "low" : "none";

  return (
    <div className="space-y-6 pb-8">
      {/* Severe alert modal */}
      {!alertModalDismissed && <SevereAlertModal latest={latest} onDismiss={() => setAlertModalDismissed(true)} />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Your Health Dashboard</h1>
        <p className="text-base text-gray-400 mt-2">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Live device status section */}
      <PatientLiveDeviceSection
        latest={latest}
        history={history}
        liveState={liveState}
        backendAvailable={backendAvailable}
        socketConnected={socketConnected}
        lastUpdatedAt={lastUpdatedAt}
      />


      {/* Daily Summary */}
      <SummaryCard
        title="Today's Summary"
        subtitle="Your tremor activity today compared to yesterday"
        trend={
          dailySummary
            ? {
                value: dailySummary.comparedToPrevious,
                label: "vs yesterday",
              }
            : undefined
        }
      >
        {summariesLoading ? (
          <div className="text-center py-8 text-gray-500">Loading today's summary...</div>
        ) : !dailySummary || dailySummary.episodeCount === 0 ? (
          <EmptyState
            icon="✅"
            title="No tremor episodes today"
            message="Great news! No tremor episodes have been recorded today. Keep up the good work!"
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Episodes" value={dailySummary.episodeCount} icon="📈" />
              <MetricCard label="Avg Frequency" value={dailySummary.averageFrequency.toFixed(1)} unit="Hz" />
              <MetricCard label="Total Duration" value={formatDuration(dailySummary.totalDurationSeconds)} />
              <MetricCard label="Detections" value={dailySummary.detectionCount} />
            </div>

            {dailySummary.dominantSeverity !== "none" && (
              <div className="p-4 rounded-xl bg-surface-overlay border border-surface-border">
                <p className="text-sm text-gray-500 mb-2">Today's severity breakdown</p>
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={dailySummary.dominantSeverity} size="md" />
                  <span className="text-sm text-gray-400">
                    High: {dailySummary.severityCounts.high} · Medium: {dailySummary.severityCounts.medium} · Low: {dailySummary.severityCounts.low}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </SummaryCard>

      {/* Weekly Summary */}
      <SummaryCard
        title="This Week's Summary"
        subtitle="Your tremor activity this week compared to last week"
        trend={
          weeklySummary
            ? {
                value: weeklySummary.comparedToPrevious,
                label: "vs last week",
              }
            : undefined
        }
      >
        {summariesLoading ? (
          <div className="text-center py-8 text-gray-500">Loading this week's summary...</div>
        ) : !weeklySummary || weeklySummary.episodeCount === 0 ? (
          <EmptyState
            icon="🎉"
            title="No tremor episodes this week"
            message="Excellent! No tremor episodes have been recorded this week. This is a great sign of progress."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Episodes" value={weeklySummary.episodeCount} icon="📊" />
              <MetricCard label="Avg Frequency" value={weeklySummary.averageFrequency.toFixed(1)} unit="Hz" />
              <MetricCard label="Total Duration" value={formatDuration(weeklySummary.totalDurationSeconds)} />
              <MetricCard label="Detections" value={weeklySummary.detectionCount} />
            </div>

            {weeklySummary.dominantSeverity !== "none" && (
              <div className="p-4 rounded-xl bg-surface-overlay border border-surface-border">
                <p className="text-sm text-gray-500 mb-2">This week's severity breakdown</p>
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={weeklySummary.dominantSeverity} size="md" />
                  <span className="text-sm text-gray-400">
                    High: {weeklySummary.severityCounts.high} · Medium: {weeklySummary.severityCounts.medium} · Low: {weeklySummary.severityCounts.low}
                  </span>
                </div>
              </div>
            )}

            {/* Daily breakdown chart */}
            <Card>
              <CardHeader title="Daily Activity" subtitle="Episodes per day this week" />
              <div className="mt-4">
                {weeklySummary.dailyBreakdown.every(d => d.count === 0) ? (
                  <EmptyState
                    icon="📅"
                    title="No daily activity"
                    message="No tremor episodes recorded on any day this week."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklySummary.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="date"
                        stroke="#888"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                      />
                      <YAxis stroke="#888" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                        labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      />
                      <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        )}
      </SummaryCard>

      {/* Dev debug panel */}
      <SerialDebugPanel />
    </div>
  );
}
