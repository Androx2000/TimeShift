// src/services/status.js
// Persists each agent's current AUX state so a page reload keeps the timer.

const statusKey = (username) => `ts_status_${username}`;
const historyKey = (username) => `ts_history_${username}_${day}`;

/**
 * Returns the saved status for a user, or null if none/corrupted.
 * @returns {{ stateId: string, startedAt: number } | null}
 * 
 */

export function dayOf(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-CA');
}

export function loadStatus(username) {
  try {
    const saved = JSON.parse(localStorage.getItem(statusKey(username)));
    return saved && saved.stateId && saved.startedAt ? saved : null;
  } catch {
    return null;
  }
}

export function saveStatus(username, stateId, startedAt) {
  localStorage.setItem(statusKey(username), JSON.stringify({ stateId, startedAt }));
}

/**
 * Returns the history entries of a given day, or [] if none/corrupted.
 * Entry shape: { stateId, startedAt, endedAt } (endedAt is null while running).
 */
export function loadHistory(username, day) {
  try {
    const list = JSON.parse(localStorage.getItem(historyKey(username, day)));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveHistory(username, day, history) {
  localStorage.setItem(historyKey(username, day), JSON.stringify(history));
}