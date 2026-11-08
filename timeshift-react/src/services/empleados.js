// src/services/empleados.js
// Lectura/escritura de los usuarios en localStorage y validaciones del CRUD
// de empleados. Usa la misma clave que services/auth.js para que el login
// vea los cambios hechos desde Gestión de Datos.

import { USUARIOS_DEMO } from '../data/usuarios';

const USERS_KEY = 'timeshift_users';
const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;
const LETTER = 'A-Za-zÁÉÍÓÚÜáéíóúüÑñ';
const NAME_RE = new RegExp(`^[${LETTER}]+(?:[ '\\-][${LETTER}]+)+$`); // al menos nombre y apellido
const ROLE_RE = /^[\p{L}\d][\p{L}\d .,&/()-]*$/u;

/** Departamentos permitidos (los mismos de la versión vanilla). */
export const DEPARTAMENTOS = ['Operaciones', 'Asesoría Legal', 'Personal Ejecutivo', 'Estrategia', 'Administración', 'Tecnología'];

/** Completa el departamento de los usuarios de demo guardados antes de que existiera ese campo. */
function withDemoDepartment(user) {
  if (user.departamento) return user;
  const demo = USUARIOS_DEMO.find((item) => item.username === user.username);
  return demo ? { ...user, departamento: demo.departamento } : user;
}

/** Todos los usuarios guardados (admins y empleados), o [] si no hay datos válidos. */
export function loadUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(parsed) ? parsed.map(withDemoDepartment) : [];
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
 * @param {{name:string, username:string, cargo:string, departamento:string, password:string}} data
 * @param {Array} users - todos los usuarios actuales (para detectar duplicados)
 * @param {string|null} editingUsername - usuario que se está editando, o null si es nuevo
 * @returns {Record<string,string>} errores por campo ({} si todo es válido)
 */
export function validateEmployee(data, users, editingUsername = null) {
  const errors = {};
  const name = data.name.trim().replace(/\s+/g, ' ');
  const username = data.username.trim().toLowerCase();
  const cargo = data.cargo.trim().replace(/\s+/g, ' ');
  const { departamento, password } = data;

  if (!name) {
    errors.name = 'El nombre es obligatorio.';
  } else if (name.length < 5 || name.length > 60) {
    errors.name = 'Debe tener entre 5 y 60 caracteres.';
  } else if (!NAME_RE.test(name)) {
    errors.name = 'Escribe nombre y apellido, solo letras (sin números ni símbolos).';
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
  } else if (cargo.length < 3 || cargo.length > 50) {
    errors.cargo = 'Debe tener entre 3 y 50 caracteres.';
  } else if (!ROLE_RE.test(cargo)) {
    errors.cargo = 'El cargo contiene caracteres no permitidos.';
  }

  if (!DEPARTAMENTOS.includes(departamento)) {
    errors.departamento = 'Selecciona un departamento válido.';
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
