/**
 * Phase 4 – Patient Reports (Complete)
 *
 * Features:
 * - List reports with status badges
 * - Doctor name and generated date
 * - Download button (opens fileUrl or shows fallback)
 * - Clean empty state
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { reportsApi } from "@/services/api/reportsApi";
import { storage } from "@/lib/storage";
import type { Report } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function PatientReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = storage.getToken();
        if (!token) return;
        const response = await reportsApi.getReports(token);
        if (response.success) setReports(response.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = (report: Report) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, "_blank");
    } else {
      // Fallback — open a JSON view of the report metadata
      const dataStr = JSON.stringify(
        {
          title: report.title,
          summary: report.summary,
          generatedAt: report.generatedAt,
          status: report.status,
        },
        null,
        2
      );
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Medical Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and download your tremor analysis reports
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {reports.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-500">No reports available yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Your doctor will generate reports based on your tremor data.
              You'll be able to download them here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <Card key={report._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center text-lg flex-shrink-0">
                      📋
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            STATUS_BADGE[report.status] || STATUS_BADGE.draft
                          }`}
                        >
                          {report.status}
                        </span>
                        {report.fileMetadata && (
                          <span className="text-xs text-gray-600">
                            {(report.fileMetadata.size / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-3 ml-13">{report.summary}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 ml-13">
                    <span>
                      Generated: {new Date(report.generatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    {report.doctorId && (
                      <span>By: Dr. {report.doctorId.name || "Doctor"}</span>
                    )}
                  </div>
                </div>

                {report.status === "completed" && (
                  <button
                    onClick={() => handleDownload(report)}
                    className="px-4 py-2 rounded-lg bg-brand-600/20 text-brand-400 text-sm font-medium border border-brand-500/30 hover:bg-brand-600/30 transition-colors ml-4 flex-shrink-0"
                  >
                    ↓ Download
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
