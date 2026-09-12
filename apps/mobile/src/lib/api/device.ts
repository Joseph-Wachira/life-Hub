import * as Device from "expo-device";

/** Sent as X-Device-Name on login/refresh so a future "manage devices" screen has something readable to show. */
export function getDeviceName(): string {
  return Device.deviceName ?? Device.modelName ?? "Unknown device";
}
