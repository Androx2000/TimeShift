import { useState, useEffect } from 'react';
import { STATES } from '../constants/states';
import { formatDuration } from '../utils/time';
import { getEmployees } from '../services/auth';
import { loadStatus } from '../services/status';
import Card from '../components/Card';
import StateBadge from '../components/StateBadge';

/** Every employee together with the status saved by their Portal. */
function readAgents() {
  return getEmployees().map((employee) => ({
    ...employee,
    status: loadStatus(employee.username),
  }));
}

export default function Dashboard() {
  const [agents, setAgents] = useState(readAgents);
  const [now, setNow] = useState(() => Date.now());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Re-read localStorage every second: changes made in the Portal
  // (even in another tab) show up here without reloading.
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAgents(readAgents());
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const term = search.trim().toLowerCase();
  const visible = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(term) &&
      (filter === 'all' || agent.status?.stateId === filter)
  );

  function timeInState(status) {
    if (!status || status.stateId === 'end') {
      return '--:--:--';
    }
    return formatDuration(now - status.startedAt);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Monitor en tiempo real</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATES.map((state) => (
          <Card key={state.id}>
            <StateBadge stateId={state.id} />
            <p className="text-3xl font-bold mt-2">
              {agents.filter((agent) => agent.status?.stateId === state.id).length}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar empleado..."
            aria-label="Buscar empleado"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filtrar por estado AUX"
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="all">Todos los estados</option>
            {STATES.map((state) => (
              <option key={state.id} value={state.id}>{state.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left font-bold px-4 py-2">Empleado</th>
                <th className="text-left font-bold px-4 py-2">Estado AUX</th>
                <th className="text-right font-bold px-4 py-2">Tiempo en estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((agent) => (
                <tr key={agent.username}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{agent.name}</p>
                    <p className="text-xs text-text-muted">{agent.cargo}</p>
                  </td>
                  <td className="px-4 py-3">
                    {agent.status
                      ? <StateBadge stateId={agent.status.stateId} />
                      : <span className="text-text-muted">Sin conexión</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{timeInState(agent.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">
              Ningún empleado coincide con la búsqueda.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}