// src/services/status.js
// Persists each agent's current AUX state so a page reload keeps the timer.

const statusKey = (username) => `ts_status_${username}`;

/**
 * Returns the saved status for a user, or null if none/corrupted.
 * @returns {{ stateId: string, startedAt: number } | null}
 */
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