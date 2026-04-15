import { Card, StatusBadge } from "@/components/ui";
import type {
  LiveConnectionState,
  LiveTelemetry,
  PatientLiveDeviceState,
} from "@/types/domain";

function formatRelativeTime(value?: Date | string | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
}

function getConnectionLabel(state: LiveConnectionState, backendAvailable: boolean, socketConnected: boolean) {
  if (!backendAvailable) {
    return {
      title: "Backend unavailable",
      subtitle: "Live API cannot be reached",
      dot: "bg-red-500",
      text: "text-red-400",
    };
  }

  if (!socketConnected) {
    return {
      title: "Socket unavailable",
      subtitle: "Realtime channel disconnected; polling fallback active",
      dot: "bg-yellow-400",
      text: "text-yellow-300",
    };
  }

  switch (state) {
    case "connected_active":
      return {
        title: "Connected and receiving",
        subtitle: "ESP32 serial stream is actively updating",
        dot: "bg-green-400 animate-pulse",
        text: "text-green-400",
      };
    case "connected_idle":
      return {
        title: "Connected but idle",
        subtitle: "Serial port is open but no fresh data arrived recently",
        dot: "bg-amber-400",
        text: "text-amber-300",
      };
    case "disconnected":
      return {
        title: "Disconnected",
        subtitle: "Device was seen before but is not currently connected",
        dot: "bg-gray-500",
        text: "text-gray-400",
      };
    case "serial_disabled":
      return {
        title: "Serial disabled",
        subtitle: "Backend serial mode is turned off",
        dot: "bg-gray-600",
        text: "text-gray-400",
      };
    case "no_data":
    default:
      return {
        title: "No data received yet",
        subtitle: "Waiting for the first serial reading from the device",
        dot: "bg-slate-500",
        text: "text-slate-400",
      };
  }
}

function MetricTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-overlay p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-gray-100">
        {value}
        {unit ? <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span> : null}
      </p>
    </div>
  );
}

function EventFeed({
  events,
  latest,
}: {
  events: PatientLiveDeviceState["recentEvents"];
  latest: LiveTelemetry | null;
}) {
  const rows = events.slice(0, 6);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-overlay p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium text-white">Recent device activity</p>
          <p className="text-xs text-gray-500">Latest serial events and parser output</p>
        </div>
        {latest?.deviceElapsedTime ? (
          <span className="text-xs text-gray-500">Device time {latest.deviceElapsedTime}</span>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No device events yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((event, index) => (
            <li key={`${event.ts}-${index}`} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-200">{event.message}</p>
                <p className="text-xs text-gray-500">{event.type}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatRelativeTime(event.ts)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PatientLiveDeviceSection({
  latest,
  liveState,
  backendAvailable,
  socketConnected,
  lastUpdatedAt,
}: {
  latest: LiveTelemetry | null;
  liveState: PatientLiveDeviceState | null;
  backendAvailable: boolean;
  socketConnected: boolean;
  lastUpdatedAt: Date | null;
}) {
  const connection = liveState?.connection;
  const label = getConnectionLabel(connection?.state ?? "no_data", backendAvailable, socketConnected);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${label.dot}`} />
              <div>
                <p className={`text-sm font-semibold ${label.text}`}>{label.title}</p>
                <p className="text-xs text-gray-500">{label.subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Device ID</p>
                <p className="text-gray-200">{liveState?.device.deviceId ?? "Not paired"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last synchronization</p>
                <p className="text-gray-200">
                  {formatRelativeTime(lastUpdatedAt ?? liveState?.device.lastSyncAt ?? liveState?.connection.lastReceivedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Serial transport</p>
                <p className="text-gray-200">
                  {liveState?.connection.serialEnabled
                    ? `${liveState.connection.portPath} @ ${liveState.connection.baudRate}`
                    : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Waveform</p>
                <p className="text-gray-200">
                  {liveState?.waveform.available ? "Available" : liveState?.waveform.reason ?? "Unavailable"}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-[220px] rounded-xl border border-surface-border bg-surface-overlay p-4">
            <p className="text-xs text-gray-500 mb-2">Current tremor status</p>
            <p className="text-lg font-semibold text-white mb-2">
              {latest?.status === "DETECTED"
                ? "Detected"
                : latest?.status === "CHECKING"
                ? "Checking"
                : latest?.status === "NOT_DETECTED"
                ? "Not detected"
                : "Unknown"}
            </p>
            {latest?.severity && latest.severity !== "NONE" ? (
              <StatusBadge severity={latest.severity as any} label={latest.severity} />
            ) : (
              <p className="text-sm text-gray-500">Severity unavailable</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricTile label="Frequency" value={latest?.frequencyHz?.toFixed(2) ?? "—"} unit="Hz" />
        <MetricTile label="Amplitude" value={latest?.amplitude?.toFixed(3) ?? "—"} unit="g" />
        <MetricTile label="SNR" value={latest?.snr?.toFixed(1) ?? "—"} unit="dB" />
        <MetricTile label="Score / Confirm" value={latest ? `${latest.score ?? "—"} / ${latest.confirmCount ?? "—"}` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-surface-border bg-surface-overlay p-4">
          <p className="text-sm font-medium text-white mb-2">Device status text</p>
          <p className="text-sm text-gray-300">{latest?.statusText ?? "Waiting for device messages."}</p>
          <p className="text-xs text-gray-500 mt-3">
            Raw waveform samples are not currently emitted by the ESP32 serial stream, so waveform rendering is intentionally unavailable in this phase.
          </p>
        </div>

        <EventFeed events={liveState?.recentEvents ?? []} latest={latest} />
      </div>
    </div>
  );
}
