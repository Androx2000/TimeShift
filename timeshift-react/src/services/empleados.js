// src/services/empleados.js
// Lectura/escritura de los usuarios en localStorage y validaciones del CRUD
// de empleados. Usa la misma clave que services/auth.js para que el login
// vea los cambios hechos desde Gestión de Datos.

const USERS_KEY = 'timeshift_users';
const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;

/** Todos los usuarios guardados (admins y empleados), o [] si no hay datos válidos. */
export function loadUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Borra el estado del Portal de un empleado eliminado (misma clave que services/status.js). */
export function clearSavedStatus(username) {
  localStorage.removeItem(`ts_status_${username}`);
}

/**
 * Valida los datos del formulario de empleado.
 * @param {{name:string, username:string, cargo:string, password:string}} data
 * @param {Array} users - todos los usuarios actuales (para detectar duplicados)
 * @param {string|null} editingUsername - usuario que se está editando, o null si es nuevo
 * @returns {Record<string,string>} errores por campo ({} si todo es válido)
 */
export function validateEmployee(data, users, editingUsername = null) {
  const errors = {};
  const name = data.name.trim();
  const username = data.username.trim().toLowerCase();
  const cargo = data.cargo.trim();
  const { password } = data;

  if (!name) {
    errors.name = 'El nombre es obligatorio.';
  } else if (name.length < 3 || name.length > 60) {
    errors.name = 'El nombre debe tener entre 3 y 60 caracteres.';
  }

  if (!editingUsername) {
    if (!username) {
      errors.username = 'El usuario es obligatorio.';
    } else if (!USERNAME_RE.test(username)) {
      errors.username = 'Use de 3 a 20 caracteres: minúsculas, números, punto, guion o guion bajo.';
    } else if (users.some((user) => user.username.toLowerCase() === username)) {
      errors.username = 'Ya existe un usuario con ese nombre.';
    }
  }

  if (!cargo) {
    errors.cargo = 'El cargo es obligatorio.';
  } else if (cargo.length > 60) {
    errors.cargo = 'El cargo no puede superar 60 caracteres.';
  }

  // Al editar, dejar la contraseña vacía significa "no cambiarla".
  if (!editingUsername || password) {
    if (!password) {
      errors.password = 'La contraseña es obligatoria.';
    } else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Mínimo 8 caracteres, con letras y números.';
    }
  }

  return errors;
}
