import { useEffect, useState } from "react";
import { socket } from "./client";

export interface DeviceStatusData {
  connected: boolean;
  deviceId: string;
  ts: string;
}

/**
 * Hook to subscribe to device connection status updates
 * Event: device:status:{patientId}
 */
export function useDeviceStatus(patientId: string | null) {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusData | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    const eventName = `device:status:${patientId}`;

    const handleStatus = (data: DeviceStatusData) => {
      setDeviceStatus(data);
    };

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(eventName, handleStatus);

    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(eventName, handleStatus);
    };
  }, [patientId]);

  return { deviceStatus, isConnected };
}
