/**
 * Phase 4 – Patient Notes Page
 *
 * Shows doctor notes that are visible to the patient (isPrivate: false).
 * Displays doctor name, diagnosis, content, and date.
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { patientMeApi } from "@/services/api/patientMeApi";
import { storage } from "@/lib/storage";
import type { DoctorNote } from "@/types";

export function PatientNotes() {
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = storage.getToken();
        if (!token) return;
        const res = await patientMeApi.getNotes(token) as any;
        if (res.success) setNotes(res.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load notes");
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
          <p className="text-gray-400">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Doctor Notes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Notes and observations from your doctor
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {notes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500">No notes available yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Your doctor will add notes after reviewing your tremor data
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note._id}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Dr. {note.doctorId?.name || "Unknown Doctor"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {note.diagnosis && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-600/20 text-brand-400 border border-brand-500/30">
                      {note.diagnosis}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 bg-surface-overlay rounded-lg border border-surface-border">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
