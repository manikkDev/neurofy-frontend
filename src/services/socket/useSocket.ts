import { useEffect } from "react";
import { socket } from "./client";

/**
 * Hook to manage socket connection lifecycle
 * Automatically connects on mount and disconnects on unmount
 */
export function useSocket() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (error: Error) => {
      console.error("[Socket] Connection error:", error);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  return socket;
}
