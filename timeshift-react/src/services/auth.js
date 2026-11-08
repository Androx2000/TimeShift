/**
 * TimeShift — Autenticación simulada con localStorage (sin backend real).
 * Migrado a módulo ES desde js/auth.js (autor original: Alan Enrique Ventura Hernández).
 */

const USERS_KEY = 'timeshift_users';
const SESSION_KEY = 'timeshift_session';

const DEFAULT_USERS = [
    { username: 'jalvarado', password: 'Jovita2026', role: 'admin', cargo: 'Dueña', name: 'Jovita Alvarado' },
                    { username: 'cgerente', password: 'Gerente2026', role: 'admin', cargo: 'Gerente', name: 'Carlos Guevara' },
                    { username: 'aruiz', password: 'Operativo1', role: 'empleado', cargo: 'Abogada Litigante', name: 'Andrea Ruiz' },
                    { username: 'mportillo', password: 'Operativo2', role: 'empleado', cargo: 'Abogada Corporativa', name: 'Marcela Portillo' },
                    { username: 'jhenriquez', password: 'Operativo3', role: 'empleado', cargo: 'Asistente Legal', name: 'Javier Henríquez' },
                    { username: 'lcastro', password: 'Operativo4', role: 'empleado', cargo: 'Asistente Legal', name: 'Luis Castro' },
                    { username: 'rflores', password: 'Operativo5', role: 'empleado', cargo: 'Recepción', name: 'Roxana Flores' },
                    { username: 'ppineda', password: 'Operativo6', role: 'empleado', cargo: 'Contabilidad', name: 'Patricia Pineda' },
                    { username: 'esantos', password: 'Operativo7', role: 'empleado', cargo: 'Mensajería / Notificador', name: 'Eduardo Santos' }
];

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
     // dato dañado en localStorage: se vuelven a sembrar los usuarios abajo
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function verifyCredentials(username, password) {
  const nombre = String(username).trim().toLowerCase();
  return getUsers().find((u) => u.username.toLowerCase() === nombre && u.password === password) || null;
}

export function createSession(user) {
  const session = {
    username: user.username,
    name: user.name,
    role: user.role,
    cargo: user.cargo,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session && session.username && session.role ? session : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// En React las vistas son rutas, no archivos .html.
export function routeForRole(role) {
  return role === 'admin' ? '/dashboard' : '/portal';
}