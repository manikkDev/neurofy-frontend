export type TremorStatus = "DETECTED" | "NOT_DETECTED" | "CHECKING" | "UNKNOWN";
export type Severity = "MILD" | "MODERATE" | "SEVERE" | "NONE";
export type DeviceStatus = "active" | "inactive" | "maintenance";
export type PairingStatus = "paired" | "unpaired" | "pending";
export type TransportType = "usb_serial" | "wifi";
export type AppointmentStatus = "requested" | "scheduled" | "confirmed" | "rejected" | "rescheduled" | "completed" | "cancelled";
export type ReportStatus = "draft" | "completed" | "archived";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type NotificationType = "appointment" | "alert" | "report" | "note" | "system";

export interface Device {
  _id: string;
  deviceId: string;
  patientId: string;
  label: string;
  pairingStatus: PairingStatus;
  status: DeviceStatus;
  transportType: TransportType;
  wifiToken?: string;
  wifiConnected?: boolean;
  wifiLastConnectedAt?: string;
  wifiIpAddress?: string;
  batteryLevel?: number;
  lastSyncAt?: string;
  firmwareVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Telemetry {
  _id: string;
  patientId: string;
  deviceId: string;
  status: TremorStatus;
  frequencyHz?: number;
  snr?: number;
  amplitude?: number;
  severity?: Severity;
  detectedAt: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TremorEpisode {
  _id: string;
  patientId: string;
  deviceId: any;
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  maxSeverity: Severity;
  episodeCount: number;
  avgFrequencyHz?: number;
  maxAmplitude?: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorNote {
  _id: string;
  patientId: any;
  doctorId: any;
  content: string;
  diagnosis?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  patientId: any;
  doctorId: any;
  title: string;
  summary: string;
  status: ReportStatus;
  fileUrl?: string;
  fileMetadata?: {
    filename: string;
    size: number;
    mimeType: string;
  };
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  patientId: any;
  doctorId: any;
  scheduledAt: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  responseNote?: string;
  rescheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  _id: string;
  patientId: string;
  deviceId: string;
  severity: Severity;
  triggeredAt: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientStats {
  totalEpisodes: number;
  severityBreakdown: {
    severe: number;
    moderate: number;
    mild: number;
  };
  recentEpisodes: number;
}

// ------------------------------------------------------------------
// Phase 3 - Live telemetry / serial pipeline types
// ------------------------------------------------------------------

/** Normalised live telemetry emitted from the serial pipeline */
export interface LiveTelemetry {
  deviceId: string;
  source: "SERIAL" | "WIRELESS";
  detectedAt: string;
  receivedAt: string;
  status: TremorStatus;
  frequencyHz?: number;
  snr?: number;
  amplitude?: number;
  severity?: Severity;
  deviceElapsedTime?: string;
  score?: number;
  confirmCount?: number;
  statusText?: string;
  rawLine: string;
}

/** Emitted when the serial device connects or disconnects */
export interface DeviceConnectionStatus {
  connected: boolean;
  deviceId: string;
  ts: string;
}

export type LiveConnectionState =
  | "connected_active"
  | "connected_idle"
  | "disconnected"
  | "no_data"
  | "serial_disabled";

export interface WaveformAvailability {
  available: boolean;
  reason: string;
  source: "SERIAL" | "WIRELESS" | "NONE";
}

export interface PatientLiveDeviceState {
  device: {
    deviceId: string | null;
    label: string | null;
    pairingStatus: string | null;
    status: string | null;
    transportType: string | null;
    batteryLevel?: number;
    lastSyncAt?: string | null;
    firmwareVersion?: string | null;
  };
  connection: {
    serialEnabled: boolean;
    connected: boolean;
    state: LiveConnectionState;
    portPath: string;
    baudRate: number;
    lastConnectedAt?: string;
    lastDisconnectedAt?: string;
    lastReceivedAt?: string;
    wifiConnected?: boolean;
    wifiLastConnectedAt?: string;
    wifiIpAddress?: string;
  };
  latestTelemetry: LiveTelemetry | null;
  recentEvents: Array<{
    type: string;
    deviceId: string;
    source: "SERIAL" | "WIRELESS";
    message: string;
    rawLine: string;
    ts: string;
  }>;
  waveform: WaveformAvailability;
}

/** Snapshot returned by GET /api/debug/serial */
export interface SerialDebugState {
  connected: boolean;
  portPath: string;
  baudRate: number;
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  lastReceivedAt?: string;
  recentRawLines: Array<{ rawLine: string; ts: string }>;
  recentEvents: Array<{
    type: string;
    deviceId: string;
    source: "SERIAL" | "WIRELESS";
    message: string;
    rawLine: string;
    ts: string;
  }>;
  lastNormalized?: LiveTelemetry;
  recentErrors: Array<{ rawLine: string; error: string; ts: string }>;
  waveform: WaveformAvailability;
}

// ------------------------------------------------------------------
// Phase 5 - Patient dashboard summary types
// ------------------------------------------------------------------

export interface DailySummary {
  period: "today";
  episodeCount: number;
  comparedToPrevious: number;
  averageFrequency: number;
  dominantSeverity: "high" | "medium" | "low" | "none";
  severityCounts: {
    high: number;
    medium: number;
    low: number;
  };
  totalDurationSeconds: number;
  detectionCount: number;
}

export interface WeeklySummary {
  period: "this_week";
  episodeCount: number;
  comparedToPrevious: number;
  averageFrequency: number;
  dominantSeverity: "high" | "medium" | "low" | "none";
  severityCounts: {
    high: number;
    medium: number;
    low: number;
  };
  totalDurationSeconds: number;
  detectionCount: number;
  dailyBreakdown: Array<{
    date: string;
    count: number;
  }>;
}
