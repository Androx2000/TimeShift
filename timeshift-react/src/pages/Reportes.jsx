// src/pages/Reportes.jsx
// Historial de estados AUX de todos los empleados, con filtros, resumen y CSV.
import { useMemo, useState } from 'react';
import Card from '../components/Card';
import StateBadge from '../components/StateBadge';
import { STATES } from '../constants/states';
import { useEmpleados } from '../hooks/useEmpleados';
import { buildRows, downloadCsv, filterRows, summarize, toCsv } from '../services/reportes';
import { formatDuration } from '../utils/time';

const EMPTY_FILTERS = { from: '', to: '', username: '', stateId: '' };

const controlClass =
  'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30';

const formatDay = (day) => day.split('-').reverse().join('/');
const formatClock = (timestamp) =>
  timestamp === null
    ? '—'
    : new Date(timestamp).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });

export default function Reportes() {
  const { empleados } = useEmpleados();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Instante de la última lectura; "Actualizar" vuelve a leer el historial guardado.
  const [snapshot, setSnapshot] = useState(() => Date.now());

  const rows = useMemo(() => buildRows(empleados, snapshot), [empleados, snapshot]);
  const visible = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const summary = useMemo(() => summarize(visible), [visible]);

  function handleFilter(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  function handleExport() {
    const day = new Date().toLocaleDateString('en-CA');
    downloadCsv(`reporte-aux-${day}.csv`, toCsv(visible));
  }

  const cards = [
    { label: 'Registros', value: String(summary.count) },
    { label: 'Tiempo total', value: formatDuration(summary.totalMs) },
    { label: 'Duración promedio', value: formatDuration(summary.avgMs) },
    { label: 'Pausas (Lunch + Break)', value: formatDuration(summary.pauseMs) },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Reportes</h2>
          <p className="text-sm text-text-muted">Registros y duraciones por empleado, con filtros y exportación.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSnapshot(Date.now())}
            className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={visible.length === 0}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <label className="text-sm font-bold text-text-muted">
            Desde
            <input type="date" name="from" value={filters.from} onChange={handleFilter} className={controlClass} />
          </label>
          <label className="text-sm font-bold text-text-muted">
            Hasta
            <input type="date" name="to" value={filters.to} onChange={handleFilter} className={controlClass} />
          </label>
          <label className="text-sm font-bold text-text-muted">
            Empleado
            <select name="username" value={filters.username} onChange={handleFilter} className={controlClass}>
              <option value="">Todos</option>
              {empleados.map((employee) => (
                <option key={employee.username} value={employee.username}>{employee.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-text-muted">
            Estado AUX
            <select name="stateId" value={filters.stateId} onChange={handleFilter} className={controlClass}>
              <option value="">Todos</option>
              {STATES.map((state) => (
                <option key={state.id} value={state.id}>{state.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono mt-2">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-base sm:text-lg font-bold mb-4">Registros detallados</h3>

        {visible.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            {rows.length === 0
              ? 'Aún no hay registros. Se generan cuando los empleados cambian de estado en su portal.'
              : 'Ningún registro coincide con los filtros.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-text-muted text-xs uppercase tracking-wider">
                  <th className="text-left font-bold px-4 py-2 rounded-l-lg">Fecha</th>
                  <th className="text-left font-bold px-4 py-2">Empleado</th>
                  <th className="text-left font-bold px-4 py-2">Cargo</th>
                  <th className="text-left font-bold px-4 py-2">Estado AUX</th>
                  <th className="text-left font-bold px-4 py-2">Inicio</th>
                  <th className="text-left font-bold px-4 py-2">Fin</th>
                  <th className="text-right font-bold px-4 py-2 rounded-r-lg">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono">{formatDay(row.day)}</td>
                    <td className="px-4 py-3 font-semibold">{row.name}</td>
                    <td className="px-4 py-3">{row.cargo}</td>
                    <td className="px-4 py-3"><StateBadge stateId={row.stateId} /></td>
                    <td className="px-4 py-3 font-mono">{formatClock(row.startedAt)}</td>
                    <td className="px-4 py-3 font-mono">{formatClock(row.endedAt)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.durationMs === null ? '—' : formatDuration(row.durationMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
