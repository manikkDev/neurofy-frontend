/**
 * Phase 5 – Doctor Dashboard (Complete)
 *
 * Live stats: total patients, active severe alerts, pending appointments.
 * Recent patients table with severity badges.
 * Recent severe alerts panel with patient names.
 * Quick-nav cards to all doctor sections.
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { doctorApi, type DoctorDashboardData } from "@/services/api/doctorApi";
import { storage } from "@/lib/storage";

function StatCard({
  label,
  value,
  icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: string;
  href?: string;
}) {
  const navigate = useNavigate();
  return (
    <Card>
      <div
        className={`flex items-center gap-3 ${href ? "cursor-pointer" : ""}`}
        onClick={() => href && navigate(href)}
      >
        <div className="w-11 h-11 rounded-xl bg-surface-overlay flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${accent ?? "text-gray-200"}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = storage.getToken();
        if (!token) return;
        const res = await doctorApi.getDashboard(token);
        if (res.success) setData(res.data!);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, Dr. {user?.name}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Monitored Patients"
          value={loading ? "…" : data?.totalPatients ?? 0}
          icon="👥"
          accent="text-brand-400"
          href="/doctor/patients"
        />
        <StatCard
          label="Active Severe Alerts"
          value={loading ? "…" : data?.activeAlerts ?? 0}
          icon="🚨"
          accent={(data?.activeAlerts ?? 0) > 0 ? "text-red-400" : "text-gray-400"}
          href="/doctor/alerts"
        />
        <StatCard
          label="Pending Appointments"
          value={loading ? "…" : data?.pendingAppointments ?? 0}
          icon="📅"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Patient List", icon: "👥", href: "/doctor/patients" },
          { label: "Severe Alerts", icon: "🚨", href: "/doctor/alerts" },
          { label: "Add Note", icon: "📝", href: "/doctor/patients" },
          { label: "Generate Report", icon: "📋", href: "/doctor/patients" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.href)}
            className="p-4 bg-surface-raised border border-surface-border rounded-xl text-left hover:bg-surface-overlay transition-colors group"
          >
            <span className="text-2xl block mb-2">{action.icon}</span>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Recent patients + severe alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent patients */}
        <Card>
          <CardHeader
            title="Recent Patient Activity"
            subtitle="Patients with latest tremor events"
          />
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data || data.recentPatients.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">No patient activity yet</p>
              <Link to="/doctor/patients" className="text-brand-400 text-sm hover:underline mt-2 block">
                View all patients →
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-surface-border">
              {data.recentPatients.map((p) => (
                <li key={p.patientId} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{p.patientName}</p>
                    <p className="text-xs text-gray-500">
                      {p.lastActivity
                        ? new Date(p.lastActivity).toLocaleString()
                        : "No activity"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.lastSeverity && (
                      <StatusBadge severity={p.lastSeverity as any} label={p.lastSeverity} />
                    )}
                    <button
                      onClick={() => navigate(`/doctor/patients/${p.patientId}`)}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      View →
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 pt-3 border-t border-surface-border">
            <Link to="/doctor/patients" className="text-sm text-brand-400 hover:text-brand-300">
              View all patients →
            </Link>
          </div>
        </Card>

        {/* Severe alerts */}
        <Card>
          <CardHeader
            title="Recent Severe Alerts"
            subtitle="Cases requiring immediate attention"
          />
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data || data.recentAlerts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">No recent severe alerts</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.recentAlerts.map((alert) => (
                <li
                  key={alert._id}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                    alert.status === "active"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-surface-overlay border-surface-border"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {alert.status === "active" && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium text-gray-200">
                        {alert.patientId?.name ?? "Unknown Patient"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </p>
                    {alert.message && (
                      <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30 flex-shrink-0">
                    SEVERE
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 pt-3 border-t border-surface-border">
            <Link to="/doctor/alerts" className="text-sm text-brand-400 hover:text-brand-300">
              View all alerts →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
