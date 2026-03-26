/**
 * Phase 4 – Patient Alerts Page
 *
 * Shows the patient's alert history with severity badges,
 * timestamps, and an acknowledge button for active alerts.
 */

import { useEffect, useState } from "react";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { patientMeApi } from "@/services/api/patientMeApi";
import { storage } from "@/lib/storage";
import type { Alert } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-red-500/20 text-red-400 border-red-500/30",
  acknowledged: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function PatientAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const token = storage.getToken();
      if (!token) return;
      const res = await patientMeApi.getAlerts(token) as any;
      if (res.success) setAlerts(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const token = storage.getToken();
      if (!token) return;
      await patientMeApi.acknowledgeAlert(alertId, token);
      // Refresh
      load();
    } catch (err: any) {
      setError(err.message || "Failed to acknowledge alert");
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tremor alert notifications and history
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Active alerts banner */}
      {activeAlerts.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-semibold text-red-300">
              {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert._id}
                className="flex items-center justify-between gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge severity={alert.severity as any} label={alert.severity} />
                  <div>
                    <p className="text-sm text-red-300">
                      {alert.message || `Severe tremor detected`}
                    </p>
                    <p className="text-xs text-red-400/70">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert._id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert history */}
      <Card>
        <CardHeader
          title="Alert History"
          subtitle={`${alerts.length} total alerts`}
        />

        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-500">No alerts yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Alerts will appear here when severe tremor events are detected
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Message</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert._id}
                    className="border-b border-surface-border hover:bg-surface-overlay transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-200">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge severity={alert.severity as any} label={alert.severity} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {alert.message || "Tremor alert"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          STATUS_BADGE[alert.status] || STATUS_BADGE.active
                        }`}
                      >
                        {alert.status}
                      </span>
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
