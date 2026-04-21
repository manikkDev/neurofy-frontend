/**
 * Patient Device Settings Page
 * 
 * Configure device connection method (USB/WiFi) and manage WiFi credentials
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth";
import { deviceApi } from "@/services/api/deviceApi";
import { storage } from "@/lib/storage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Wifi, Usb, Copy, RotateCw, Check, X, AlertCircle } from "lucide-react";
import type { Device } from "@/types";

export function PatientDeviceSettings() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [wifiConfig, setWifiConfig] = useState<{
    deviceId: string;
    wifiToken: string;
    serverUrl: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    if (!user) return;

    try {
      const token = storage.getToken();
      if (!token) return;

      const response = await deviceApi.getDevices(token);

      if (response.success && response.data) {
        setDevices(response.data);
        if (response.data.length > 0) {
          setSelectedDevice(response.data[0]);
          if (response.data[0].transportType === "wifi") {
            await loadWiFiConfig(response.data[0]._id, token);
          }
        }
      }
    } catch (err) {
      setError("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const loadWiFiConfig = async (deviceId: string, token: string) => {
    try {
      const response = await deviceApi.getWiFiConfig(deviceId, token);
      if (response.success && response.data) {
        setWifiConfig(response.data);
      }
    } catch (err) {
      console.error("Failed to load WiFi config:", err);
    }
  };

  const handleTransportChange = async (transportType: "usb_serial" | "wifi") => {
    if (!selectedDevice || !user) return;

    setError(null);
    setSuccess(null);

    try {
      const token = storage.getToken();
      if (!token) return;

      const response = await deviceApi.updateTransportType(
        selectedDevice._id,
        transportType,
        token
      );

      if (response.success && response.data) {
        setSelectedDevice(response.data);
        setDevices(
          devices.map((d) => (d._id === selectedDevice._id ? response.data! : d))
        );

        if (transportType === "wifi") {
          await loadWiFiConfig(selectedDevice._id, token);
        } else {
          setWifiConfig(null);
        }

        setSuccess(
          `Device configured for ${transportType === "wifi" ? "WiFi" : "USB Serial"} connection`
        );
      }
    } catch (err) {
      setError("Failed to update transport type");
    }
  };

  const handleRegenerateToken = async () => {
    if (!selectedDevice || !user) return;

    setError(null);
    setSuccess(null);

    try {
      const token = storage.getToken();
      if (!token) return;

      const response = await deviceApi.regenerateWiFiToken(selectedDevice._id, token);

      if (response.success && response.data) {
        setWifiConfig({
          ...wifiConfig!,
          wifiToken: response.data.wifiToken,
        });
        setSuccess("WiFi token regenerated successfully");
      }
    } catch (err) {
      setError("Failed to regenerate WiFi token");
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading device settings..." />;
  }

  if (devices.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-6">Device Settings</h1>
        <div className="bg-surface-raised rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-200 mb-2">No Device Found</h2>
          <p className="text-gray-400">You don't have any registered devices yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Device Settings</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {selectedDevice && (
        <div className="bg-surface-raised rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Connection Method</h2>
            <p className="text-gray-400 text-sm mb-4">
              Choose how your device connects to the Neurofy platform
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleTransportChange("usb_serial")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedDevice.transportType === "usb_serial"
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-surface-border hover:border-brand-500/50"
                }`}
                aria-label="Use USB Serial connection"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Usb className="w-6 h-6 text-brand-400" />
                  <h3 className="font-semibold text-gray-100">USB Serial</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Connect via USB cable. Reliable and simple setup.
                </p>
              </button>

              <button
                onClick={() => handleTransportChange("wifi")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedDevice.transportType === "wifi"
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-surface-border hover:border-brand-500/50"
                }`}
                aria-label="Use WiFi connection"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Wifi className="w-6 h-6 text-brand-400" />
                  <h3 className="font-semibold text-gray-100">WiFi</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Connect wirelessly. More freedom of movement.
                </p>
              </button>
            </div>
          </div>

          {selectedDevice.transportType === "wifi" && wifiConfig && (
            <div className="border-t border-surface-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">WiFi Configuration</h2>
                <button
                  onClick={handleRegenerateToken}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-400 hover:text-brand-300 border border-brand-500/30 rounded-lg hover:bg-brand-500/10 transition-colors"
                  aria-label="Regenerate WiFi token"
                >
                  <RotateCw className="w-4 h-4" />
                  Regenerate Token
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Use these credentials to configure your ESP32 device. Follow the{" "}
                <a
                  href="/files/WIFI_SETUP_GUIDE.md"
                  target="_blank"
                  className="text-brand-400 hover:text-brand-300 underline"
                >
                  WiFi Setup Guide
                </a>{" "}
                for step-by-step instructions.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Device ID
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={wifiConfig.deviceId}
                      readOnly
                      className="flex-1 px-3 py-2 bg-surface-overlay border border-surface-border rounded-lg text-gray-100 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(wifiConfig.deviceId, "deviceId")}
                      className="p-2 hover:bg-surface-overlay rounded-lg transition-colors"
                      aria-label="Copy Device ID"
                    >
                      {copiedField === "deviceId" ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WiFi Token
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={wifiConfig.wifiToken}
                      readOnly
                      className="flex-1 px-3 py-2 bg-surface-overlay border border-surface-border rounded-lg text-gray-100 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(wifiConfig.wifiToken, "wifiToken")}
                      className="p-2 hover:bg-surface-overlay rounded-lg transition-colors"
                      aria-label="Copy WiFi Token"
                    >
                      {copiedField === "wifiToken" ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Server URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={wifiConfig.serverUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-surface-overlay border border-surface-border rounded-lg text-gray-100 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(wifiConfig.serverUrl, "serverUrl")}
                      className="p-2 hover:bg-surface-overlay rounded-lg transition-colors"
                      aria-label="Copy Server URL"
                    >
                      {copiedField === "serverUrl" ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Next Steps:</strong>
                  <br />
                  1. Flash the ESP32 firmware to your device
                  <br />
                  2. Connect to the device via USB Serial
                  <br />
                  3. Run the CONFIG command to enter these credentials
                  <br />
                  4. Switch to WiFi mode and verify connection
                </p>
              </div>
            </div>
          )}

          {selectedDevice.transportType === "wifi" && selectedDevice.wifiConnected && (
            <div className="border-t border-surface-border pt-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Connection Status</h3>
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Check className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">WiFi Connected</p>
                  {selectedDevice.wifiIpAddress && (
                    <p className="text-sm text-gray-400 mt-1">
                      IP Address: {selectedDevice.wifiIpAddress}
                    </p>
                  )}
                  {selectedDevice.wifiLastConnectedAt && (
                    <p className="text-sm text-gray-400 mt-1">
                      Last connected:{" "}
                      {new Date(selectedDevice.wifiLastConnectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
