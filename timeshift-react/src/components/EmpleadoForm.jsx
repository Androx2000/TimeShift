// src/components/EmpleadoForm.jsx
// Formulario para agregar o editar un empleado, con validación por campo.
import { useState } from 'react';
import { validateEmployee } from '../services/empleados';

const EMPTY_FORM = { name: '', username: '', cargo: '', password: '' };

const inputClass =
  'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-slate-100 disabled:text-text-muted';

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-text-muted">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-muted mt-1">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-end mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function EmpleadoForm({ editing, users, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    editing
      ? { name: editing.name, username: editing.username, cargo: editing.cargo, password: '' }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validateEmployee(form, users, editing ? editing.username : null);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      onSubmit(form);
    }
  }

  const props = (name) => ({
    id: `emp-${name}`,
    name,
    value: form[name],
    onChange: handleChange,
    className: inputClass,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `emp-${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <h3 className="text-base sm:text-lg font-bold">
        {editing ? `Editar empleado: ${editing.name}` : 'Nuevo empleado'}
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field id="emp-name" label="Nombre completo" error={errors.name}>
          <input type="text" autoComplete="off" {...props('name')} />
        </Field>

        <Field
          id="emp-username"
          label="Usuario"
          error={errors.username}
          hint={editing ? 'El usuario no se puede cambiar.' : 'Ejemplo: jperez'}
        >
          <input type="text" autoComplete="off" disabled={Boolean(editing)} {...props('username')} />
        </Field>

        <Field id="emp-cargo" label="Cargo" error={errors.cargo}>
          <input type="text" autoComplete="off" {...props('cargo')} />
        </Field>

        <Field
          id="emp-password"
          label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          error={errors.password}
          hint={editing ? 'Déjela vacía para conservar la actual.' : 'Mínimo 8 caracteres, con letras y números.'}
        >
          <input type="password" autoComplete="new-password" {...props('password')} />
        </Field>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary-hover"
        >
          {editing ? 'Guardar cambios' : 'Agregar empleado'}
        </button>
      </div>
    </form>
  );
}
