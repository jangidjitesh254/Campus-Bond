import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Tiny key/value store for the auth token and small flags.
 * SecureStore on iOS/Android; localStorage on web (SecureStore has no web impl).
 *
 * Reads are cached in memory: SecureStore goes through the Android Keystore,
 * which costs a few hundred milliseconds per call, and the token is needed
 * on every API request.
 */
const isWeb = Platform.OS === 'web';
const cache = new Map();

export async function getItem(key) {
  if (cache.has(key)) return cache.get(key);
  let value = null;
  try {
    value = isWeb ? globalThis.localStorage?.getItem(key) ?? null : await SecureStore.getItemAsync(key);
  } catch {
    value = null;
  }
  cache.set(key, value);
  return value;
}

export async function setItem(key, value) {
  cache.set(key, value);
  try {
    if (isWeb) globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {}
}

export async function deleteItem(key) {
  cache.set(key, null);
  try {
    if (isWeb) globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {}
}
