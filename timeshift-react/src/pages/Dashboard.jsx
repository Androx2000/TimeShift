import { useState, useEffect } from 'react';
import ApiWidgets from '../components/ApiWidgets';
import { getAvatarUrl, createFallbackAvatarDataUri } from '../services/externalApi';

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');

  function loadEmployees() {
    try {
      const saved = localStorage.getItem('ts_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEmployees(parsed);
          return;
        }
      }
    } catch (e) {}

    // Semilla inicial si aún no se han registrado en el prototipo
    const initial = [
      { id: 1, name: 'Andrea Ruiz', role: 'Abogada Litigante', department: 'Asesoría Legal', state: 'Disponible', colorId: 'available', time: '02:15:30' },
      { id: 2, name: 'Marcela Portillo', role: 'Abogada Corporativa', department: 'Estrategia', state: 'Lunch', colorId: 'lunch', time: '00:35:10' },
      { id: 3, name: 'Javier Henríquez', role: 'Asistente Legal', department: 'Asesoría Legal', state: 'Break', colorId: 'break', time: '00:12:45' },
      { id: 4, name: 'Eduardo Santos', role: 'Mensajería / Notificador', department: 'Operaciones', state: 'Salida', colorId: 'end', time: '00:00:00' },
    ];
    setEmployees(initial);
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const stateLabels = {
    available: 'Disponible',
    lunch: 'Lunch',
    break: 'Break',
    end: 'Salida',
  };

  const stateColors = {
    available: '#16A34A',
    lunch: '#64748B',
    break: '#8B5CF6',
    end: '#EF4444',
  };

  const filtered = employees.filter((emp) => {
    const term = search.trim().toLowerCase();
    const matchesName = (emp.name || '').toLowerCase().includes(term);
    const matchesState = selectedState === 'all' || emp.colorId === selectedState;
    return matchesName && matchesState;
  });

  const counts = {
    available: employees.filter((e) => e.colorId === 'available').length,
    lunch: employees.filter((e) => e.colorId === 'lunch').length,
    break: employees.filter((e) => e.colorId === 'break').length,
    end: employees.filter((e) => e.colorId === 'end').length,
  };

  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
          TimeShift · Dashboard Administrativo
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Supervisión de estados AUX y servicios externos integrados
        </p>
      </header>

      {/* Componente de Consumo de APIs Externas */}
      <ApiWidgets />

      {/* Tarjetas de Estados AUX */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {Object.entries(stateLabels).map(([key, label]) => (
          <div key={key} style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: stateColors[key] }}>
              {label}
            </span>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
              {counts[key] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Buscar empleado por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '240px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px'
          }}
        />
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            background: '#ffffff'
          }}
        >
          <option value="all">Todos los estados AUX</option>
          <option value="available">Disponible</option>
          <option value="lunch">Lunch</option>
          <option value="break">Break</option>
          <option value="end">Salida</option>
        </select>
      </div>

      {/* Tabla de Empleados con Avatares de la API DiceBear */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>Empleado (DiceBear API)</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>Departamento</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>Estado AUX</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>Tiempo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No se encontraron empleados coincidentes.
                </td>
              </tr>
            ) : (
              filtered.map((emp, index) => {
                const color = stateColors[emp.colorId] || '#64748b';
                const avatar = getAvatarUrl(emp.name);
                return (
                  <tr key={emp.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={avatar}
                          alt={emp.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = createFallbackAvatarDataUri(emp.name);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#e2e8f0',
                            objectFit: 'cover'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.role || 'Operativo'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '14px', color: '#475569' }}>
                      {emp.department || 'General'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: color,
                        border: `1px solid ${color}`
                      }}>
                        {stateLabels[emp.colorId] || emp.state}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {emp.time || '00:00:00'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
