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
import { socket, connectSocket } from "@/services/socket/client";
import { patientMeApi } from "@/services/api/patientMeApi";
import { storage } from "@/lib/storage";
import type { LiveTelemetry, DeviceConnectionStatus, PatientLiveDeviceState } from "@/types/domain";

const MAX_HISTORY = 30;
const POLL_INTERVAL_MS = 2000;

export interface LiveTelemetryState {
  latest: LiveTelemetry | null;
  history: LiveTelemetry[];
  deviceConnected: boolean;
  lastUpdatedAt: Date | null;
  liveState: PatientLiveDeviceState | null;
  socketConnected: boolean;
  backendAvailable: boolean;
}

export function useLiveTelemetry(patientId: string | undefined): LiveTelemetryState {
  const [state, setState] = useState<LiveTelemetryState>({
    latest: null,
    history: [],
    deviceConnected: false,
    lastUpdatedAt: null,
    liveState: null,
    socketConnected: false,
    backendAvailable: true,
  });

  // Track the last rawLine we processed so we don't duplicate entries
  const lastRawLineRef = useRef<string | null>(null);

  // ----------------------------------------------------------------
  // PRIMARY: HTTP polling
  // ----------------------------------------------------------------
  const poll = useCallback(async () => {
    const token = storage.getToken();
    if (!token) return;

    try {
      const response = await patientMeApi.getLive(token);
      const live = response.data;
      if (!live) {
        return;
      }

      const normalized = live.latestTelemetry;

      if (!normalized) {
        setState((prev) => ({
          ...prev,
          liveState: live,
          deviceConnected: live.connection.connected,
          backendAvailable: true,
          lastUpdatedAt: live.connection.lastReceivedAt
            ? new Date(live.connection.lastReceivedAt)
            : prev.lastUpdatedAt,
        }));
        return;
      }

      // Only push to history if this is a new reading (diff rawLine)
      if (normalized.rawLine === lastRawLineRef.current) {
        setState((prev) => ({
          ...prev,
          latest: normalized,
          liveState: live,
          deviceConnected: live.connection.connected,
          backendAvailable: true,
          lastUpdatedAt: new Date(normalized.receivedAt ?? normalized.detectedAt),
        }));
        return;
      }

      lastRawLineRef.current = normalized.rawLine;

      setState((prev) => {
        const newHistory = [...prev.history, normalized].slice(-MAX_HISTORY);
        return {
          latest: normalized,
          history: newHistory,
          deviceConnected: live.connection.connected,
          lastUpdatedAt: new Date(normalized.receivedAt ?? normalized.detectedAt),
          liveState: live,
          socketConnected: prev.socketConnected,
          backendAvailable: true,
        };
      });
    } catch {
      setState((prev) => ({
        ...prev,
        backendAvailable: false,
      }));
    }
  }, []);

  useEffect(() => {
    if (!patientId) return;

    // Immediate first poll
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [patientId, poll]);

  // ----------------------------------------------------------------
  // SECONDARY: Socket.IO for sub-second updates between polls
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!patientId) return;

    try {
      connectSocket();
      const telemetryEventName = `telemetry:live:${patientId}`;
      const deviceEventName = `device:status:${patientId}`;

      const onTelemetry = (data: LiveTelemetry) => {
        if (data.rawLine === lastRawLineRef.current) return; // already have it from poll
        lastRawLineRef.current = data.rawLine;
        setState((prev) => {
          const newHistory = [...prev.history, data].slice(-MAX_HISTORY);
          return {
            latest: data,
            history: newHistory,
            deviceConnected: true,
            lastUpdatedAt: new Date(data.receivedAt ?? data.detectedAt),
            liveState: prev.liveState
              ? {
                  ...prev.liveState,
                  latestTelemetry: data,
                  connection: {
                    ...prev.liveState.connection,
                    connected: true,
                  },
                }
              : prev.liveState,
            socketConnected: prev.socketConnected,
            backendAvailable: true,
          };
        });
      };

      const onDeviceStatus = (data: DeviceConnectionStatus) => {
        setState((prev) => ({
          ...prev,
          deviceConnected: data.connected,
          liveState: prev.liveState
            ? {
                ...prev.liveState,
                connection: {
                  ...prev.liveState.connection,
                  connected: data.connected,
                },
              }
            : prev.liveState,
        }));
      };

      const onConnect = () => {
        setState((prev) => ({ ...prev, socketConnected: true }));
      };

      const onDisconnect = () => {
        setState((prev) => ({ ...prev, socketConnected: false }));
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on(telemetryEventName, onTelemetry);
      socket.on(deviceEventName, onDeviceStatus);

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off(telemetryEventName, onTelemetry);
        socket.off(deviceEventName, onDeviceStatus);
      };
    } catch {
      setState((prev) => ({ ...prev, socketConnected: false }));
    }
  }, [patientId]);

  return state;
}
