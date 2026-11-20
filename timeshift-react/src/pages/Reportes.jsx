
import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import ChartCanvas from '../components/ChartCanvas';
import KpiCard from '../components/KpiCard';
import StateBadge from '../components/StateBadge';
import { STATES, findState, stateColor } from '../constants/states';
import { useEmpleados } from '../hooks/useEmpleados';
import { getSession } from '../services/auth';
import { downloadPdf } from '../services/reportePdf';
import {
  buildRows,
  downloadCsv,
  filterRows,
  formatClock,
  formatDay,
  minutesByDay,
  summarize,
  summarizeByState,
  toCsv,
} from '../services/reportes';
import { formatDuration } from '../utils/time';

const EMPTY_FILTERS = { from: '', to: '', username: '', stateId: '' };

// Cada cuánto se vuelve a leer el historial. Además se escucha el evento
// "storage", así un cambio en el Portal (en otra pestaña) se ve al instante.
const REFRESH_MS = 5000;

const DONUT_ID = 'grafica-distribucion';
const BARS_ID = 'grafica-por-dia';

const controlClass =
  'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30';

/** Minutos (con decimales) → "HH:MM:SS" para los tooltips. */
const minutesToText = (minutes) => formatDuration(minutes * 60000);

// Opciones fijas de las gráficas: van fuera del componente para que
// ChartCanvas no destruya y vuelva a crear la gráfica en cada render.
const DONUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label(context) {
          const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
          const percent = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0.0';
          return ` ${context.label}: ${minutesToText(context.raw)} (${percent} %)`;
        },
      },
    },
  },
};

const BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Minutos' } },
  },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (context) => ` ${context.dataset.label}: ${minutesToText(context.raw)}`,
      },
    },
  },
};

export default function Reportes() {
  const { empleados } = useEmpleados();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [exporting, setExporting] = useState(false);
  // Instante de la última lectura del historial; al cambiar, se recalcula todo.
  const [snapshot, setSnapshot] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => setSnapshot(Date.now());
    const intervalId = setInterval(refresh, REFRESH_MS);
    window.addEventListener('storage', refresh);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const rows = useMemo(() => buildRows(empleados, snapshot), [empleados, snapshot]);
  const visible = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const summary = useMemo(() => summarize(visible), [visible]);
  const byState = useMemo(() => summarizeByState(visible), [visible]);

  // Dona: qué parte del tiempo se fue en cada estado.
  const donutData = useMemo(
    () => ({
      labels: byState.map((item) => findState(item.stateId).label),
      datasets: [
        {
          data: byState.map((item) => Math.round(item.totalMs / 6000) / 10),
          backgroundColor: byState.map((item) => stateColor(item.stateId)),
          borderWidth: 2,
        },
      ],
    }),
    [byState]
  );

  // Barras apiladas: minutos de cada estado, día por día.
  const barData = useMemo(() => {
    const { days, minutes } = minutesByDay(visible);
    return {
      labels: days.map(formatDay),
      datasets: Object.entries(minutes).map(([stateId, values]) => ({
        label: findState(stateId).label,
        data: values,
        backgroundColor: stateColor(stateId),
        borderRadius: 4,
      })),
    };
  }, [visible]);

  function handleFilter(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  function handleExportCsv() {
    const day = new Date().toLocaleDateString('en-CA');
    downloadCsv(`reporte-aux-${day}.csv`, toCsv(visible));
  }

  /** Período elegido en los filtros, en texto. */
  function describePeriod() {
    const { from, to } = filters;
    if (from && to) return `Del ${formatDay(from)} al ${formatDay(to)}`;
    if (from) return `Desde el ${formatDay(from)}`;
    if (to) return `Hasta el ${formatDay(to)}`;
    return 'Todos los registros';
  }

  /** Filtros aplicados, en texto, para el encabezado del PDF. */
  function describeFilters() {
    const employee = empleados.find((item) => item.username === filters.username);
    return [
      ['Período', describePeriod()],
      ['Empleado', employee ? employee.name : 'Todos'],
      ['Estado AUX', filters.stateId ? findState(filters.stateId).label : 'Todos'],
    ];
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      await downloadPdf({
        rows: visible,
        summary,
        details: describeFilters(),
        generatedBy: getSession()?.name ?? 'Administrador',
        chartIds: byState.length > 0 ? [DONUT_ID, BARS_ID] : [],
      });
    } finally {
      setExporting(false);
    }
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
          <p className="mt-1 flex items-center gap-2 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-available animate-pulse" aria-hidden="true" />
            Se actualiza automáticamente · {formatClock(snapshot)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExportCsv} disabled={visible.length === 0}>
            Exportar CSV
          </Button>
          <Button onClick={handleExportPdf} disabled={visible.length === 0 || exporting}>
            {exporting ? 'Generando PDF…' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
          <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
            Limpiar filtros
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      {byState.length > 0 && (
        // min-w-0: sin esto, el ancho del <canvas> no deja que la columna se achique
        // al reducir la ventana y la página queda con scroll horizontal.
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold mb-4">Distribución del tiempo</h3>
            <ChartCanvas
              id={DONUT_ID}
              type="doughnut"
              data={donutData}
              options={DONUT_OPTIONS}
              label="Gráfica de dona con el porcentaje del tiempo en cada estado AUX"
            />
          </Card>
          <Card className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold mb-4">Minutos por día</h3>
            <ChartCanvas
              id={BARS_ID}
              type="bar"
              data={barData}
              options={BAR_OPTIONS}
              label="Gráfica de barras con los minutos de cada estado AUX por día"
            />
          </Card>
        </div>
      )}

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