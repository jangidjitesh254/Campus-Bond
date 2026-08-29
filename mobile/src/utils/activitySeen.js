import * as SecureStore from 'expo-secure-store';

const KEY = 'campusbond_activity_seen';

/**
 * When the student last opened the activity screen, as a timestamp. Anything
 * that happened before this has already been seen, so the bell stays quiet.
 * Returns 0 when they have never opened it.
 */
export async function getActivitySeenAt() {
  try {
    const value = await SecureStore.getItemAsync(KEY);
    const at = Number(value);
    return Number.isFinite(at) && at > 0 ? at : 0;
  } catch {
    return 0; // a storage failure should not hide the badge forever
  }
}

/** Mark everything up to now as seen. */
export async function markActivitySeen() {
  try {
    await SecureStore.setItemAsync(KEY, String(Date.now()));
  } catch {
    /* non-fatal — the badge simply stays until next time */
  }
}
