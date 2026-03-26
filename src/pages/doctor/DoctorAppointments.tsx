/**
 * Phase 6 – Doctor Appointments (Complete)
 *
 * Features:
 * - View all appointments grouped by pending vs confirmed/past
 * - Action buttons on pending: Accept, Reject, Reschedule
 * - Reschedule opens modal to pick a new date/time & add note
 * - Reject/Accept open small prompt/modal or just add note inline
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { appointmentsApi } from "@/services/api/appointmentsApi";
import { storage } from "@/lib/storage";
import type { Appointment } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  requested: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  rescheduled: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  rejected: "bg-red-900/40 text-red-500 border-red-800",
};

export function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{ id: string; current: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);

  // Form states
  const [note, setNote] = useState("");
  const [newDate, setNewDate] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const token = storage.getToken();
      if (!token) return;
      // Doctor's appointments endpoint gets everything
      const res = await appointmentsApi.getAppointments(token);
      if (res.success) setAppointments(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      setProcessingId(id);
      const token = storage.getToken();
      if (!token) return;
      await appointmentsApi.acceptAppointment(id, undefined, token);
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to accept");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      setProcessingId(rejectModal);
      const token = storage.getToken();
      if (!token) return;
      await appointmentsApi.rejectAppointment(rejectModal, note, token);
      setRejectModal(null);
      setNote("");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !newDate) return;
    try {
      setProcessingId(rescheduleModal.id);
      const token = storage.getToken();
      if (!token) return;
      await appointmentsApi.rescheduleAppointment(
        rescheduleModal.id,
        new Date(newDate).toISOString(),
        note,
        token
      );
      setRescheduleModal(null);
      setNewDate("");
      setNote("");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to reschedule");
    } finally {
      setProcessingId(null);
    }
  };

  const pending = appointments.filter((a) => a.status === "requested");
  const history = appointments.filter((a) => a.status !== "requested");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review requests and manage your schedule
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Pending Requests */}
      <h2 className="text-lg font-semibold text-white">Pending Requests ({pending.length})</h2>
      {pending.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <span className="text-3xl">☕</span>
            <p className="text-gray-500 mt-3">No pending appointment requests</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((apt) => (
            <Card key={apt._id}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-semibold text-white">
                      {new Date(apt.scheduledAt).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium border bg-purple-500/20 text-purple-400 border-purple-500/30">
                      REQUESTED
                    </span>
                  </div>
                  <Link
                    to={`/doctor/patients/${apt.patientId?._id}`}
                    className="text-brand-400 hover:text-brand-300 transition-colors font-medium text-sm"
                  >
                    {apt.patientId?.name || "Unknown Patient"}
                  </Link>
                  <span className="text-gray-500 text-sm ml-2">({apt.patientId?.email})</span>
                  {apt.reason && (
                    <p className="text-sm text-gray-400 mt-2">
                      <span className="text-gray-500">Reason:</span> {apt.reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(apt._id)}
                    disabled={processingId === apt._id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processingId === apt._id ? "..." : "Accept"}
                  </button>
                  <button
                    onClick={() => {
                      setRescheduleModal({ id: apt._id, current: apt.scheduledAt });
                      setNote("");
                    }}
                    disabled={processingId === apt._id}
                    className="px-4 py-2 bg-surface-overlay hover:bg-surface-raised border border-surface-border text-gray-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => {
                      setRejectModal(apt._id);
                      setNote("");
                    }}
                    disabled={processingId === apt._id}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      <h2 className="text-lg font-semibold text-white mt-10">Confirmed & Past Appointments</h2>
      <Card>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No confirmed appointments</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {history.map((apt) => (
              <div key={apt._id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {new Date(apt.scheduledAt).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_BADGE[apt.status] || STATUS_BADGE.scheduled}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-gray-500">Patient: </span>
                    <Link to={`/doctor/patients/${apt.patientId?._id}`} className="text-gray-300 hover:text-brand-300">
                      {apt.patientId?.name || "Unknown"}
                    </Link>
                  </div>
                  {(apt.reason || apt.responseNote) && (
                    <div className="text-sm mt-2 space-y-1">
                      {apt.reason && <p className="text-gray-400"><span className="text-gray-500">Reason:</span> {apt.reason}</p>}
                      {apt.responseNote && <p className="text-brand-400/80"><span className="text-gray-500">Your Note:</span> {apt.responseNote}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-surface-raised border border-surface-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Reschedule Appointment</h3>
            <p className="text-sm text-gray-400 mb-4">
              Current slot: {new Date(rescheduleModal.current).toLocaleString()}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">New Date & Time</label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-overlay border border-surface-border text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Note to Patient (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Schedule conflict, this slot works better"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-overlay border border-surface-border text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRescheduleModal(null)}
                className="flex-1 py-2 rounded-lg border border-surface-border text-gray-400 hover:bg-surface-overlay"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!newDate || processingId === rescheduleModal.id}
                className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
              >
                {processingId === rescheduleModal.id ? "Saving..." : "Send Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-surface-raised border border-red-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Reject Appointment</h3>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to decline this request?
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Reason to Patient (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Please book a later slot"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-overlay border border-surface-border text-white text-sm focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2 rounded-lg border border-surface-border text-gray-400 hover:bg-surface-overlay"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === rejectModal}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {processingId === rejectModal ? "Rejecting..." : "Decline Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
