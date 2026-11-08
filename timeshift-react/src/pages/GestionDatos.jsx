// src/pages/GestionDatos.jsx
// CRUD de empleados: agregar, editar y eliminar, con validaciones y mensajes.
import { useState } from 'react';
import Card from '../components/Card';
import EmpleadoForm from '../components/EmpleadoForm';
import { useEmpleados } from '../hooks/useEmpleados';

export default function GestionDatos() {
  const { users, empleados, addEmpleado, updateEmpleado, removeEmpleado } = useEmpleados();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // empleado en edición, o null si es uno nuevo
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }

  const term = search.trim().toLowerCase();
  const visible = empleados.filter((employee) =>
    [employee.name, employee.username, employee.cargo, employee.departamento ?? ''].join(' ').toLowerCase().includes(term)
  );

  function openNew() {
    setEditing(null);
    setFormOpen(true);
    setMessage(null);
  }

  function openEdit(employee) {
    setEditing(employee);
    setFormOpen(true);
    setMessage(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSave(data) {
    if (editing) {
      updateEmpleado(editing.username, data);
      setMessage({ type: 'ok', text: `Se actualizó a ${data.name.trim()}.` });
    } else {
      addEmpleado(data);
      setMessage({ type: 'ok', text: `Se agregó a ${data.name.trim()}.` });
    }
    closeForm();
  }

  function handleDelete(employee) {
    if (!window.confirm(`¿Eliminar a ${employee.name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    removeEmpleado(employee.username);
    if (editing && editing.username === employee.username) {
      closeForm();
    }
    setMessage({ type: 'ok', text: `Se eliminó a ${employee.name}.` });
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Gestión de empleados</h2>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary-hover"
        >
          Nuevo empleado
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm font-semibold rounded-xl px-4 py-3 ${
            message.type === 'ok' ? 'bg-available/10 text-available' : 'bg-end/10 text-end'
          }`}
        >
          {message.text}
        </p>
      )}

      {formOpen && (
        <Card>
          <EmpleadoForm
            key={editing ? editing.username : 'nuevo'}
            editing={editing}
            users={users}
            onSubmit={handleSave}
            onCancel={closeForm}
          />
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <label className="sr-only" htmlFor="emp-search">Buscar empleado</label>
          <input
            id="emp-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, usuario o cargo"
            className="w-full sm:w-80 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-text-muted">
            {visible.length} de {empleados.length} empleados
          </span>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            {empleados.length === 0
              ? 'Aún no hay empleados registrados.'
              : 'Ningún empleado coincide con la búsqueda.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-text-muted text-xs uppercase tracking-wider">
                  <th className="text-left font-bold px-4 py-2 rounded-l-lg">Nombre</th>
                  <th className="text-left font-bold px-4 py-2">Usuario</th>
                  <th className="text-left font-bold px-4 py-2">Cargo</th>
                  <th className="text-left font-bold px-4 py-2">Departamento</th>
                  <th className="text-right font-bold px-4 py-2 rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((employee) => (
                  <tr key={employee.username}>
                    <td className="px-4 py-3 font-semibold">{employee.name}</td>
                    <td className="px-4 py-3 font-mono">{employee.username}</td>
                    <td className="px-4 py-3">{employee.cargo}</td>
                    <td className="px-4 py-3">{employee.departamento ?? '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(employee)}
                        aria-label={`Editar a ${employee.name}`}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 mr-2"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(employee)}
                        aria-label={`Eliminar a ${employee.name}`}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-end text-white hover:brightness-105"
                      >
                        Eliminar
                      </button>
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
