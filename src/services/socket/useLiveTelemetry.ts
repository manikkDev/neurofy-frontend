import { useEffect, useState } from "react";
import { socket } from "./client";

export interface LiveTelemetryData {
  status: "DETECTED" | "NOT_DETECTED";
  frequencyHz?: number;
  snr?: number;
  amplitude?: number;
  severity?: "MILD" | "MODERATE" | "SEVERE";
  detectedAt: string;
  deviceId: string;
  patientId: string;
}

/**
 * Hook to subscribe to live telemetry updates for a specific patient
 * Event: telemetry:live:{patientId}
 */
export function useLiveTelemetry(patientId: string | null) {
  const [telemetry, setTelemetry] = useState<LiveTelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    const eventName = `telemetry:live:${patientId}`;

    const handleTelemetry = (data: LiveTelemetryData) => {
      setTelemetry(data);
    };

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(eventName, handleTelemetry);

    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(eventName, handleTelemetry);
    };
  }, [patientId]);

  return { telemetry, isConnected };
}
