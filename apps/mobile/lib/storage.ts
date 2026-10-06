import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createJSONStorage } from 'zustand/middleware';

const TOKEN_KEY = 'eo.auth.token';

/** Auth tokens live in the iOS Keychain / Android Keystore via SecureStore. */
export const secureToken = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(TOKEN_KEY, token);
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

/** Non-sensitive persisted state (cart, favourites). */
export const persistStorage = createJSONStorage(() => AsyncStorage);
