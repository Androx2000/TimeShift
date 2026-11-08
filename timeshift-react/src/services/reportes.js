// src/services/reportes.js
// Arma las filas del reporte a partir del historial que guarda el Portal
// (services/status.js) y calcula filtros, resumen y exportación a CSV.

import { findState } from '../constants/states';
import { formatDuration } from '../utils/time';
import { loadHistory } from './status';

const HISTORY_KEY_RE = /^ts_history_(.+)_(\d{4}-\d{2}-\d{2})$/;

/** Pares { username, day } de todos los historiales guardados en localStorage. */
function listHistories() {
  const found = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const match = HISTORY_KEY_RE.exec(localStorage.key(i) ?? '');
    if (match) {
      found.push({ username: match[1], day: match[2] });
    }
  }
  return found;
}

/**
 * Una fila por cada cambio de estado registrado, de la más reciente a la más antigua.
 * "Salida" es una marca de fin de turno, por eso no lleva duración.
 * @param {Array} empleados - empleados actuales (para mostrar nombre y cargo)
 * @param {number} now - instante usado para medir los estados que siguen abiertos
 */
export function buildRows(empleados, now) {
  const byUsername = new Map(empleados.map((employee) => [employee.username, employee]));
  const rows = [];

  for (const { username, day } of listHistories()) {
    const person = byUsername.get(username);
    for (const entry of loadHistory(username, day)) {
      if (!entry || typeof entry.startedAt !== 'number') {
        continue;
      }
      const endedAt = entry.endedAt ?? null;
      rows.push({
        id: `${username}|${entry.startedAt}`,
        day,
        username,
        name: person?.name ?? username,
        cargo: person?.cargo ?? '—',
        stateId: entry.stateId,
        startedAt: entry.startedAt,
        endedAt,
        durationMs: entry.stateId === 'end' ? null : Math.max(0, (endedAt ?? now) - entry.startedAt),
      });
    }
  }

  return rows.sort((a, b) => b.startedAt - a.startedAt);
}

/** Aplica los filtros del formulario. Un filtro vacío no restringe nada. */
export function filterRows(rows, { from, to, username, stateId }) {
  return rows.filter(
    (row) =>
      (!from || row.day >= from) &&
      (!to || row.day <= to) &&
      (!username || row.username === username) &&
      (!stateId || row.stateId === stateId)
  );
}

/** Totales para las tarjetas del reporte (las filas sin duración no cuentan en los tiempos). */
export function summarize(rows) {
  const timed = rows.filter((row) => row.durationMs !== null);
  const sum = (list) => list.reduce((total, row) => total + row.durationMs, 0);
  const totalMs = sum(timed);
  return {
    count: rows.length,
    totalMs,
    avgMs: timed.length > 0 ? totalMs / timed.length : 0,
    pauseMs: sum(timed.filter((row) => row.stateId === 'lunch' || row.stateId === 'break')),
  };
}

const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
const clockTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Convierte las filas a texto CSV (separado por comas, con comillas). */
export function toCsv(rows) {
  const header = ['Fecha', 'Empleado', 'Usuario', 'Cargo', 'Estado AUX', 'Inicio', 'Fin', 'Duración'];
  const lines = rows.map((row) => [
    row.day,
    row.name,
    row.username,
    row.cargo,
    findState(row.stateId).label,
    clockTime(row.startedAt),
    row.endedAt === null ? '' : clockTime(row.endedAt),
    row.durationMs === null ? '' : formatDuration(row.durationMs),
  ]);
  return [header, ...lines].map((columns) => columns.map(quote).join(',')).join('\r\n');
}

/** Descarga el CSV en el navegador (con BOM para que Excel respete los acentos). */
export function downloadCsv(filename, csvText) {
  const blob = new Blob([`\ufeff${csvText}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
