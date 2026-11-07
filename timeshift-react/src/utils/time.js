// src/utils/time.js
// Time helpers shared by Portal, Monitor and Reports.

/**
 * Formats a duration in milliseconds as HH:MM:SS.
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} e.g. "01:02:05"
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => n.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}