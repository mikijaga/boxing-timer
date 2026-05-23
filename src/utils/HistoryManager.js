/**
 * HistoryManager.js
 *
 * Saves, loads, and deletes completed workout sessions
 * using AsyncStorage (phone-local storage — no database needed).
 *
 * Data is stored under one key as a JSON array, newest first.
 * It is wiped when the user clears the app's storage in
 * Android Settings → Apps → RoundMaster → Clear Storage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'roundmaster_session_history';

/**
 * Save a new session, OR if sourceId is provided (i.e. it's a repeated
 * session), remove the original entry and put the new one at the top.
 * This prevents duplicates when the user repeats a past session.
 */
export async function saveSession(session, sourceId = null) {
  try {
    let existing = await loadHistory();

    // If this is a repeat, remove the original entry first
    if (sourceId) {
      existing = existing.filter(s => s.id !== sourceId);
    }

    // Add the new/updated session at the top (newest first)
    const updated = [session, ...existing];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('HistoryManager: failed to save session', e);
  }
}

/** Return the full history array (newest first). Returns [] on error. */
export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('HistoryManager: failed to load history', e);
    return [];
  }
}

/** Remove a single session by its id */
export async function deleteSession(id) {
  try {
    const existing = await loadHistory();
    const updated  = existing.filter(s => s.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('HistoryManager: failed to delete session', e);
  }
}

/** Wipe the entire history */
export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.warn('HistoryManager: failed to clear history', e);
  }
}