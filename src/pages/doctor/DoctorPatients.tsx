/**
 * Phase 5 – Doctor Patient List (Complete)
 *
 * Searchable by name / email.
 * Each row shows: name, email, last severity badge, last activity,
 * total episodes, device status dot, active alert count.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { doctorApi, type PatientListItem } from "@/services/api/doctorApi";
import { storage } from "@/lib/storage";

function DeviceDot({ status, paired }: { status: string | null; paired: boolean }) {
  if (!paired || !status) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-600">
        <span className="w-2 h-2 rounded-full bg-gray-700" />
        No device
      </span>
    );
  }
  const active = status === "active";
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className={`w-2 h-2 rounded-full ${active ? "bg-green-400 animate-pulse" : "bg-yellow-500"}`} />
      {status}
    </span>
  );
}

export function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchText), 350);
    return () => clearTimeout(id);
  }, [searchText]);

  const load = useCallback(async (q?: string) => {
    try {
      setLoading(true);
      const token = storage.getToken();
      if (!token) return;
      const res = await doctorApi.getPatients(token, q || undefined);
      if (res.success) setPatients(res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(debouncedSearch || undefined);
  }, [debouncedSearch, load]);

  return (
    <div className="space-y-5">
      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {patients.length} patient{patients.length !== 1 ? "s" : ""}
            {debouncedSearch ? ` matching "${debouncedSearch}"` : " in system"}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full px-4 py-2.5 pl-10 rounded-lg bg-surface-overlay border border-surface-border text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">🔍</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader title="Patient List" subtitle="Click any row to open the clinical detail view" />

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-500">
              {debouncedSearch ? "No patients match your search" : "No patients registered yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  {["Patient", "Email", "Last Activity", "Last Severity", "Episodes", "Device", "Alerts"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => navigate(`/doctor/patients/${p._id}`)}
                    className="border-b border-surface-border hover:bg-surface-overlay cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-gray-200">{p.name}</p>
                      <p className="text-xs text-gray-600 font-mono">{p._id.toString().slice(-8)}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">{p.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {p.lastActivity
                        ? new Date(p.lastActivity).toLocaleDateString()
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {p.lastSeverity ? (
                        <StatusBadge severity={p.lastSeverity as any} label={p.lastSeverity} />
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 font-medium">{p.totalEpisodes}</td>
                    <td className="py-3 px-4">
                      <DeviceDot status={p.deviceStatus} paired={p.devicePaired} />
                    </td>
                    <td className="py-3 px-4">
                      {p.activeAlerts > 0 ? (
                        <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                          {p.activeAlerts} ⚠
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
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
