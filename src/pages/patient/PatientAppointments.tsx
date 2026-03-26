/**
 * Phase 4 – Patient Appointments (Complete)
 *
 * Features:
 * - Book new appointment (modal form with doctor selector, date, reason)
 * - View upcoming appointments
 * - View past appointments
 * - Status badges with proper colors
 */

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui";
import { appointmentsApi } from "@/services/api/appointmentsApi";
import { patientMeApi } from "@/services/api/patientMeApi";
import { storage } from "@/lib/storage";

import type { Appointment } from "@/types";

interface Doctor {
  _id: string;
  name: string;
  email: string;
}

const STATUS_BADGE: Record<string, string> = {
  requested: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  rescheduled: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  rejected: "bg-red-900/40 text-red-500 border-red-800",
};

export function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking form state
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const token = storage.getToken();
      if (!token) return;

      const [aptsRes, docsRes] = await Promise.all([
        appointmentsApi.getAppointments(token),
        patientMeApi.getDoctors(token),
      ]);

      if (aptsRes.success) setAppointments(aptsRes.data || []);
      if ((docsRes as any).success) setDoctors((docsRes as any).data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBook = async () => {
    if (!selectedDoctor || !scheduledDate) return;
    try {
      setBookingLoading(true);
      const token = storage.getToken();
      if (!token) return;

      await appointmentsApi.createAppointment(
        {
          doctorId: selectedDoctor,
          scheduledAt: new Date(scheduledDate).toISOString(),
          reason: reason || undefined,
        },
        token
      );

      setShowBooking(false);
      setSelectedDoctor("");
      setScheduledDate("");
      setReason("");
      load();
    } catch (err: any) {
      setError(err.message || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelAppt = async (id: string) => {
    try {
      const token = storage.getToken();
      if (!token) return;
      await appointmentsApi.cancelAppointment(id, token);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to cancel");
    }
  };

  const upcoming = appointments.filter(
    (apt) =>
      new Date(apt.scheduledAt) >= new Date() &&
      ["requested", "scheduled", "confirmed", "rescheduled"].includes(apt.status)
  );
  const past = appointments.filter(
    (apt) =>
      new Date(apt.scheduledAt) < new Date() || ["completed", "cancelled", "rejected"].includes(apt.status)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your doctor appointments
          </p>
        </div>
        <button
          onClick={() => setShowBooking(true)}
          className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Book Appointment
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-surface-raised border border-surface-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Book Appointment</h2>
              <button
                onClick={() => setShowBooking(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Select Doctor</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-overlay border border-surface-border text-gray-200 text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-overlay border border-surface-border text-gray-200 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Reason <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Brief description of your concern..."
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-overlay border border-surface-border text-gray-200 text-sm focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBooking(false)}
                className="flex-1 py-2.5 rounded-lg border border-surface-border text-gray-400 text-sm font-medium hover:bg-surface-overlay transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={!selectedDoctor || !scheduledDate || bookingLoading}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <Card>
        <CardHeader
          title="Upcoming Appointments"
          subtitle={`${upcoming.length} scheduled`}
        />
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-gray-500">No upcoming appointments</p>
            <p className="text-sm text-gray-600 mt-1">
              Book one using the button above
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {upcoming.map((apt) => (
              <div
                key={apt._id}
                className="p-4 bg-surface-overlay rounded-lg border border-surface-border"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white">
                        {new Date(apt.scheduledAt).toLocaleString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          STATUS_BADGE[apt.status] || STATUS_BADGE.scheduled
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    {apt.doctorId && (
                      <p className="text-sm text-gray-400 mb-1">
                        With: Dr. {apt.doctorId.name || "Doctor"}
                      </p>
                    )}
                    {apt.reason && (
                      <p className="text-sm text-gray-400 mt-2"><span className="text-gray-500">Reason:</span> {apt.reason}</p>
                    )}
                    {apt.responseNote && (
                      <p className="text-sm text-brand-400 mt-1 pb-1">Note: {apt.responseNote}</p>
                    )}
                  </div>
                  {["requested", "scheduled", "confirmed", "rescheduled"].includes(apt.status) && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to cancel this appointment?")) cancelAppt(apt._id);
                      }}
                      className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/20"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Past */}
      <Card>
        <CardHeader
          title="Past Appointments"
          subtitle={`${past.length} completed`}
        />
        {past.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No past appointments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Doctor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((apt) => (
                  <tr
                    key={apt._id}
                    className="border-b border-surface-border hover:bg-surface-overlay transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-200">
                      {new Date(apt.scheduledAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-200">
                      Dr. {apt.doctorId?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">{apt.reason || "—"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          STATUS_BADGE[apt.status] || STATUS_BADGE.scheduled
                        }`}
                      >
                        {apt.status}
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
