/**
 * Phase 4 – Patient History (Complete)
 *
 * Uses /api/patients/me/history and /me/stats — no hardcoded patient IDs.
 * Shows episode table with severity, duration, frequency, and pagination-ready.
 */

import { useEffect, useState } from "react";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { patientMeApi } from "@/services/api/patientMeApi";
import { storage } from "@/lib/storage";
import type { TremorEpisode, PatientStats } from "@/types";

export function PatientHistory() {
  const [history, setHistory] = useState<TremorEpisode[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = storage.getToken();
        if (!token) return;

        const [historyRes, statsRes] = await Promise.all([
          patientMeApi.getHistory(token),
          patientMeApi.getStats(token),
        ]);

        if (historyRes.success) setHistory(historyRes.data || []);
        if (statsRes.success) setStats(statsRes.data || null);
      } catch (err: any) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tremor History</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your tremor episode records
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-500 mb-1">Total Episodes</p>
            <p className="text-2xl font-bold text-brand-400">{stats.totalEpisodes}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 mb-1">Severe</p>
            <p className="text-2xl font-bold text-severity-severe">
              {stats.severityBreakdown.severe}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 mb-1">Moderate</p>
            <p className="text-2xl font-bold text-severity-moderate">
              {stats.severityBreakdown.moderate}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 mb-1">Mild</p>
            <p className="text-2xl font-bold text-severity-mild">
              {stats.severityBreakdown.mild}
            </p>
          </Card>
        </div>
      )}

      {/* Episode table */}
      <Card>
        <CardHeader
          title="Episode Records"
          subtitle={`${history.length} episodes recorded`}
        />

        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📈</div>
            <p className="text-gray-500">No episodes recorded yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Episodes will appear here as your device detects tremors
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Frequency</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amplitude</th>
                </tr>
              </thead>
              <tbody>
                {history.map((episode, idx) => (
                  <tr
                    key={episode._id}
                    className="border-b border-surface-border hover:bg-surface-overlay transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 text-sm text-gray-200">
                      {new Date(episode.startedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge severity={episode.maxSeverity as any} label={episode.maxSeverity} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-200">
                      {episode.durationSec ? `${episode.durationSec.toFixed(0)}s` : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-200">
                      {episode.avgFrequencyHz
                        ? `${episode.avgFrequencyHz.toFixed(1)} Hz`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-200">
                      {episode.maxAmplitude
                        ? `${episode.maxAmplitude.toFixed(3)} g`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
