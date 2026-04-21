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
  
  // Add patient modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [addingPatient, setAddingPatient] = useState(false);
  const [addPatientError, setAddPatientError] = useState<string | null>(null);

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

  // Search patient by email
  const searchPatientByEmail = async () => {
    if (!searchEmail.trim()) return;
    
    setSearchingPatient(true);
    setFoundPatient(null);
    setAddPatientError(null);
    
    try {
      const token = storage.getToken();
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/patients/search-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: searchEmail.trim() }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFoundPatient(result.data);
      } else {
        setAddPatientError(result.error?.message || 'Patient not found');
      }
    } catch (err: any) {
      setAddPatientError(err.message || 'Failed to search patient');
    } finally {
      setSearchingPatient(false);
    }
  };

  // Add patient to doctor's list
  const addPatientToDoctor = async () => {
    if (!foundPatient) return;
    
    setAddingPatient(true);
    setAddPatientError(null);
    
    try {
      const token = storage.getToken();
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/patients/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId: foundPatient._id }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh patient list
        load();
        // Close modal
        setShowAddModal(false);
        // Reset state
        setSearchEmail("");
        setFoundPatient(null);
        setAddPatientError(null);
      } else {
        setAddPatientError(result.error?.message || 'Failed to add patient');
      }
    } catch (err: any) {
      setAddPatientError(err.message || 'Failed to add patient');
    } finally {
      setAddingPatient(false);
    }
  };

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
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2.5 pl-10 rounded-lg bg-surface-overlay border border-surface-border text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">🔍</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            + Add Patient
          </button>
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

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-2 border border-surface-border rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Patient</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchEmail("");
                  setFoundPatient(null);
                  setAddPatientError(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Patient Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter patient's email..."
                    className="flex-1 px-3 py-2 bg-surface-overlay border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
                    onKeyPress={(e) => e.key === 'Enter' && searchPatientByEmail()}
                  />
                  <button
                    onClick={searchPatientByEmail}
                    disabled={searchingPatient || !searchEmail.trim()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {searchingPatient ? '...' : 'Search'}
                  </button>
                </div>
              </div>

              {addPatientError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{addPatientError}</p>
                </div>
              )}

              {foundPatient && (
                <div className="p-4 bg-surface-overlay border border-surface-border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{foundPatient.name}</h3>
                      <p className="text-sm text-gray-400">{foundPatient.email}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Patient since {new Date(foundPatient.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {foundPatient.latestEpisode && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Latest Episode</p>
                        <StatusBadge 
                          severity={foundPatient.latestEpisode.maxSeverity as any} 
                          label={foundPatient.latestEpisode.maxSeverity}
                        />
                      </div>
                    )}
                  </div>
                  
                  {foundPatient.alreadyAssigned ? (
                    <p className="text-sm text-yellow-400">This patient is already assigned to you.</p>
                  ) : (
                    <button
                      onClick={addPatientToDoctor}
                      disabled={addingPatient}
                      className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      {addingPatient ? 'Adding...' : 'Add to My Patients'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
