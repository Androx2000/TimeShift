import { useState, useEffect } from 'react';
import { STATES } from '../constants/states';
import { formatDuration } from '../utils/time';
import { getSession } from '../services/auth';
import { loadStatus, saveStatus } from '../services/status';

export default function Portal() {
  const username = getSession().username;

  const [saved] = useState(() => loadStatus(username));
  const [current, setCurrent] = useState(
    () => STATES.find((state) => state.id === saved?.stateId) ?? STATES[0]
  );
  const [startedAt, setStartedAt] = useState(() => saved?.startedAt ?? Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  function changeState(next, timestamp) {
    if (next.id === current.id) {
      return;
    }
    setCurrent(next);
    setStartedAt(timestamp);
    setNow(timestamp);
    saveStatus(username, next.id, timestamp);
  }

  const elapsed = current.id === 'end' ? '--:--:--' : formatDuration(now - startedAt);

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
    </div>
  );
}