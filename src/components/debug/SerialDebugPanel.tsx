/**
 * Phase 3 – SerialDebugPanel
 *
 * Developer-only collapsible panel that polls GET /api/debug/serial
 * every 5 seconds and shows:
 *   - serial connection status
 *   - last few raw serial lines
 *   - recent parser errors
 *
 * Only rendered in development mode (import.meta.env.DEV).
 * Uses a floating toggle button so it doesn't disrupt layout.
 */

import { useEffect, useState } from "react";
import type { SerialDebugState } from "@/types/domain";

const POLL_INTERVAL_MS = 5_000;
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export function SerialDebugPanel() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SerialDebugState | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    async function fetch_() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/debug/serial`);
        const json = await res.json();
        setData(json.data);
        setFetchError(null);
      } catch (e: any) {
        setFetchError(e?.message ?? "Fetch failed");
      } finally {
        setLoading(false);
      }
    }

    fetch_();
    const id = setInterval(fetch_, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [open]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left text-xs font-mono px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
          open
            ? "bg-surface-2 border-brand-500 text-brand-400"
            : "bg-surface-2 border-surface-border text-gray-500 hover:border-gray-500"
        }`}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          (data?.connected || data?.lastNormalized?.source === "WIRELESS") ? "bg-green-400 animate-pulse" : "bg-red-500"
        }`} />
        <span>⚙ Serial Debug</span>
        {loading && <span className="ml-auto text-gray-600">loading…</span>}
        <span className="ml-auto">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-1 bg-surface-2 border border-surface-border rounded-lg p-3 space-y-3 text-xs font-mono text-gray-300 max-h-96 overflow-y-auto">
          {fetchError && (
            <p className="text-red-400">Error: {fetchError}</p>
          )}

          {data && (
            <>
              {/* Connection status - Serial or WiFi */}
              <div>
                <p className="text-gray-500 mb-1">Connection</p>
                {data.lastNormalized?.source === "WIRELESS" ? (
                  <div className="flex gap-3">
                    <span className="text-green-400">● WIFI CONNECTED</span>
                    <span className="text-gray-600">WiFi HTTP Mode</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <span className={data.connected ? "text-green-400" : "text-red-400"}>
                      {data.connected ? "● SERIAL CONNECTED" : "○ SERIAL DISCONNECTED"}
                    </span>
                    <span className="text-gray-600">
                      {data.portPath} @ {data.baudRate}
                    </span>
                  </div>
                )}
                {data.lastReceivedAt && (
                  <p className="text-gray-600">
                    Last data: {new Date(data.lastReceivedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Last normalized */}
              {data.lastNormalized && (
                <div>
                  <p className="text-gray-500 mb-1">Last Normalized</p>
                  <div className="bg-black/30 rounded p-2 text-green-300">
                    <p>{data.lastNormalized.severity ?? "—"} | {data.lastNormalized.frequencyHz?.toFixed(2) ?? "?"} Hz | SNR {data.lastNormalized.snr?.toFixed(1) ?? "?"}</p>
                  </div>
                </div>
              )}

              {/* Recent raw lines */}
              {data.recentRawLines.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">Raw Lines (last {data.recentRawLines.slice(0, 10).length})</p>
                  <div className="bg-black/30 rounded p-2 space-y-0.5 max-h-32 overflow-y-auto">
                    {data.recentRawLines.slice(0, 10).map((l, i) => (
                      <p key={i} className="text-gray-400 leading-tight">{l.rawLine}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Parser errors */}
              {data.recentErrors.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">Parser Errors</p>
                  <div className="bg-black/30 rounded p-2 space-y-0.5">
                    {data.recentErrors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-red-400">{e.error}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!data && !fetchError && !loading && (
            <p className="text-gray-600">Waiting for data…</p>
          )}
        </div>
      )}
    </div>
  );
}
