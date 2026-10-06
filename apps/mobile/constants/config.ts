import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Port the backend listens on during local development (apps/backend PORT). */
const DEV_API_PORT = 5000;

/**
 * In development, reuse the address of the machine running Metro (Expo knows it —
 * that's where the app was downloaded from). This makes physical phones on the
 * same Wi-Fi reach the local backend without hard-coding an IP that changes
 * between networks.
 */
function devMachineApiUrl(): string | null {
  if (!__DEV__) return null;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  // Tunnel URLs (*.exp.direct) point at Expo's proxy, not at the backend.
  if (!host || host.endsWith('.exp.direct')) return null;
  // The Android emulator reaches the host machine via 10.0.2.2, not localhost.
  const reachableHost =
    Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1') ? '10.0.2.2' : host;
  return `http://${reachableHost}:${DEV_API_PORT}/api`;
}

function resolveApiUrl(): string {
  // 1. Explicit configuration always wins (staging/production builds set this in eas.json).
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  // 2. Development: the dev machine's address (works on simulators AND physical devices).
  const fromDevHost = devMachineApiUrl();
  if (fromDevHost) return fromDevHost;
  // 3. Last resort for simulators/emulators.
  return Platform.OS === 'android' ? `http://10.0.2.2:${DEV_API_PORT}/api` : `http://localhost:${DEV_API_PORT}/api`;
}

export const API_URL = resolveApiUrl();
export const REQUEST_TIMEOUT_MS = 15_000;

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[api] ${API_URL}`);
}
