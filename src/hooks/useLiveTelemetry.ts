/**
 * Phase 4.1 – useLiveTelemetry
 *
 * PRIMARY: HTTP polling of /api/debug/serial every 2 seconds.
 * This is the reliable bridge-mode approach — same mechanism the
 * SerialDebugPanel uses, which already shows data correctly.
 *
 * SECONDARY: Socket.IO for low-latency updates between polls.
 * Socket events update state immediately when they arrive.
 *
 * Why polling first:
 *   Socket.IO pub/sub misses events that fire before the component
 *   mounts or during re-subscriptions. Polling always shows the
 *   latest state from the backend regardless of timing.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { connectSocket, getSocket } from "@/services/socket/client";
import type { LiveTelemetry, DeviceConnectionStatus, SerialDebugState } from "@/types/domain";

const MAX_HISTORY = 30;
const POLL_INTERVAL_MS = 2000;
// Use VITE_API_BASE_URL but strip trailing /api to get the base server URL
const _rawApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const API_BASE = _rawApiBase
  ? _rawApiBase.replace(/\/api\/?$/, "")
  : "http://localhost:5000";


export interface LiveTelemetryState {
  latest: LiveTelemetry | null;
  history: LiveTelemetry[];
  deviceConnected: boolean;
  lastUpdatedAt: Date | null;
}

export function useLiveTelemetry(_patientId: string | undefined): LiveTelemetryState {
  const [state, setState] = useState<LiveTelemetryState>({
    latest: null,
    history: [],
    deviceConnected: false,
    lastUpdatedAt: null,
  });

  // Track the last rawLine we processed so we don't duplicate entries
  const lastRawLineRef = useRef<string | null>(null);

  // ----------------------------------------------------------------
  // PRIMARY: HTTP polling
  // ----------------------------------------------------------------
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/debug/serial`);
      if (!res.ok) return;
      const json = await res.json() as { ok: boolean; data: SerialDebugState };
      const dbg = json.data;
      if (!dbg) return;

      // Update connection status
      const connected = dbg.connected;

      // Use lastNormalized as the latest telemetry
      const normalized = dbg.lastNormalized;
      if (!normalized) {
        setState((prev) => ({ ...prev, deviceConnected: connected }));
        return;
      }

      // Only push to history if this is a new reading (diff rawLine)
      if (normalized.rawLine === lastRawLineRef.current) {
        setState((prev) => ({ ...prev, deviceConnected: connected }));
        return;
      }

      lastRawLineRef.current = normalized.rawLine;

      setState((prev) => {
        const newHistory = [...prev.history, normalized].slice(-MAX_HISTORY);
        return {
          latest: normalized,
          history: newHistory,
          deviceConnected: connected,
          lastUpdatedAt: new Date(),
        };
      });
    } catch {
      // If backend is unreachable, stay silent — do not crash
    }
  }, []);

  useEffect(() => {
    // Immediate first poll
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  // ----------------------------------------------------------------
  // SECONDARY: Socket.IO for sub-second updates between polls
  // ----------------------------------------------------------------
  useEffect(() => {
    try {
      connectSocket();
      const socket = getSocket();

      const onTelemetry = (data: LiveTelemetry) => {
        if (data.rawLine === lastRawLineRef.current) return; // already have it from poll
        lastRawLineRef.current = data.rawLine;
        setState((prev) => {
          const newHistory = [...prev.history, data].slice(-MAX_HISTORY);
          return {
            latest: data,
            history: newHistory,
            deviceConnected: prev.deviceConnected,
            lastUpdatedAt: new Date(),
          };
        });
      };

      const onDeviceStatus = (data: DeviceConnectionStatus) => {
        setState((prev) => ({ ...prev, deviceConnected: data.connected }));
      };

      socket.on("telemetry:live:all", onTelemetry);
      socket.on("device:status:all", onDeviceStatus);

      return () => {
        socket.off("telemetry:live:all", onTelemetry);
        socket.off("device:status:all", onDeviceStatus);
      };
    } catch {
      // Socket setup failed — polling still works
    }
  }, []);

  return state;
}
