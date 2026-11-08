import { useState, useEffect } from 'react';
import { STATES, findState } from '../constants/states';
import Card from '../components/Card';
import StateBadge from '../components/StateBadge';
import { formatDuration } from '../utils/time';
import { getSession } from '../services/auth';
import { loadStatus, saveStatus, loadHistory, saveHistory, dayOf } from '../services/status';

export default function Portal() {

  const findState = (id) => STATES.find((state) => state.id === id) ?? STATES[0];
  const formatClock = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
  const username = getSession().username;

  const [saved] = useState(() => loadStatus(username));
  const [current, setCurrent] = useState(
    () => STATES.find((state) => state.id === saved?.stateId) ?? STATES[0]
  );
  const [startedAt, setStartedAt] = useState(() => saved?.startedAt ?? Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState(() => loadHistory(username, dayOf(Date.now())));

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  function changeState(next, timestamp) {
    if (next.id === current.id) {
      return;
    }
    if (next.id === 'end' && !window.confirm('¿Registrar tu salida? Se detendrá el cronómetro.')) {
      return;
    }

    // First change of the day: record the state the agent was already in.
    const base = history.length > 0
      ? history
      : [{ stateId: current.id, startedAt, endedAt: null }];

    // Close the running entry and open a new one for the next state.
    const updated = [
      ...base.map((entry) => (entry.endedAt === null ? { ...entry, endedAt: timestamp } : entry)),
      { stateId: next.id, startedAt: timestamp, endedAt: null },
    ];

    setCurrent(next);
    setStartedAt(timestamp);
    setNow(timestamp);
    setHistory(updated);
    saveStatus(username, next.id, timestamp);
    saveHistory(username, dayOf(timestamp), updated);
  }

  const elapsed = current.id === 'end' ? '--:--:--' : formatDuration(now - startedAt);

  function entryDuration(entry) {
    if (entry.endedAt !== null) {
      return formatDuration(entry.endedAt - entry.startedAt);
    }
    return entry.stateId === 'end' ? 'Fin de turno' : formatDuration(now - entry.startedAt);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <h2 className="text-sm sm:text-base font-bold text-text-muted mb-4">
        Selecciona tu Estado de Trabajo (Código AUX)
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATES.map((state) => {
          const isActive = state.id === current.id;
          return (
            <button
              key={state.id}
              type="button"
              onClick={() => changeState(state, Date.now())}
              aria-pressed={isActive}
              className={`${state.bg} text-white font-bold rounded-2xl h-16 shadow-sm transition
                            hover:-translate-y-0.5 hover:brightness-105 active:scale-95
                            ${isActive ? 'ring-4 ring-primary/30 -translate-y-0.5' : ''}`}
            >
              {state.label}
            </button>
          );
        })}
      </div>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mt-6 text-center">
        <p className="text-sm font-bold text-primary uppercase tracking-wider">
          Tiempo en estado actual ({current.label})
        </p>
        <div className="font-mono text-6xl sm:text-7xl font-bold my-2">{elapsed}</div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold">Historial de Hoy</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-text-muted">
            {history.length} registros
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            Aún no hay cambios de estado hoy.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left font-bold px-4 py-2 rounded-l-lg">Hora</th>
                <th className="text-left font-bold px-4 py-2">Estado</th>
                <th className="text-right font-bold px-4 py-2 rounded-r-lg">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...history].reverse().map((entry) => {
                const state = findState(entry.stateId);
                return (
                  <tr key={entry.startedAt}>
                    <td className="px-4 py-3 font-mono">{formatClock(entry.startedAt)}</td>
                    <td className="px-4 py-3">                        
                      <td className="px-4 py-3"><StateBadge stateId={entry.stateId} /></td>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{entryDuration(entry)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}