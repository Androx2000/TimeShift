import { useState, useEffect } from 'react';
import { fetchRandomEmployee, getAvatarUrl, createFallbackAvatarDataUri } from '../services/externalApi';

export default function GestionDatos() {
  const [employees, setEmployees] = useState([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [mensaje, setMensaje] = useState('');

  function loadList() {
    try {
      const data = JSON.parse(localStorage.getItem('ts_employees')) || [];
      if (Array.isArray(data)) setEmployees(data);
    } catch {
      setEmployees([]);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function handleImportFromApi() {
    setLoadingApi(true);
    setMensaje('');
    try {
      const res = await fetchRandomEmployee();
      const newEmp = {
        id: Date.now(),
        name: res.employee.name,
        email: res.employee.email,
        phone: res.employee.phone,
        role: res.employee.role,
        department: res.employee.department,
        shift: res.employee.shift,
        state: 'Disponible',
        colorId: 'available',
        time: '00:00:00',
      };

      const updated = [newEmp, ...employees];
      localStorage.setItem('ts_employees', JSON.stringify(updated));
      setEmployees(updated);
      setMensaje(`✅ Empleado "${newEmp.name}" importado exitosamente desde ${res.source || 'API externa'}.`);
    } catch (err) {
      setMensaje(`❌ Error al consumir la API externa: ${err.message}`);
    } finally {
      setLoadingApi(false);
    }
  }

  function handleEliminar(id) {
    if (!window.confirm('¿Desea eliminar este registro de empleado?')) return;
    const updated = employees.filter((e) => e.id !== id);
    localStorage.setItem('ts_employees', JSON.stringify(updated));
    setEmployees(updated);
  }

  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px 0' }}>
            Gestión de Personal
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Administración de empleados con soporte para consumo de APIs REST externas
          </p>
        </div>

        {/* Botón de Consumo de API Externa */}
        <button
          type="button"
          onClick={handleImportFromApi}
          disabled={loadingApi}
          style={{
            background: '#0f172a',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            border: 'none',
            cursor: loadingApi ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span>🌐</span>
          {loadingApi ? 'Importando desde API...' : 'Importar desde API Externa (RandomUser)'}
        </button>
      </header>

      {mensaje && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: mensaje.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
          color: mensaje.startsWith('✅') ? '#065f46' : '#991b1b',
          border: `1px solid ${mensaje.startsWith('✅') ? '#a7f3d0' : '#fecaca'}`,
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          {mensaje}
        </div>
      )}

      {/* Tabla de registros */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>Foto (DiceBear API)</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>Nombre</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>Cargo</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>Departamento</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>Correo</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay empleados registrados. Utilice el botón superior para importar desde la API externa.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <img
                      src={getAvatarUrl(emp.name)}
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
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{emp.name}</td>
                  <td style={{ padding: '12px 16px', color: '#475569', fontSize: '14px' }}>{emp.role || emp.cargo || 'Operativo'}</td>
                  <td style={{ padding: '12px 16px', color: '#475569', fontSize: '14px' }}>{emp.department || 'General'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{emp.email || '--'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleEliminar(emp.id)}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
