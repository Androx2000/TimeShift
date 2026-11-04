/**
 * TimeShift — Autenticación simulada con localStorage (sin backend real).
 * Migrado a módulo ES desde js/auth.js (autor original: Alan Enrique Ventura Hernández).
 */

const USERS_KEY = 'timeshift_users';
const SESSION_KEY = 'timeshift_session';

const DEFAULT_USERS = [
    { username: "jalvarado", password: "Jovita2026", nombre: "Jovita Alvarado", rol: "admin", cargo: "Dueña", area: "Dirección" },
    { username: "cgerente", password: "Gerente2026", nombre: "Carlos Menéndez", rol: "admin", cargo: "Gerente", area: "Dirección" },
    { username: "aruiz", password: "Operativo1", nombre: "Ana Ruiz", rol: "empleado", cargo: "Abogada Litigante", area: "Litigios" },
    { username: "mportillo", password: "Operativo2", nombre: "Marta Portillo", rol: "empleado", cargo: "Abogada Corporativa", area: "Corporativo" },
    { username: "jhenriquez", password: "Operativo3", nombre: "José Henríquez", rol: "empleado", cargo: "Asistente Legal", area: "Litigios" },
    { username: "lcastro", password: "Operativo4", nombre: "Laura Castro", rol: "empleado", cargo: "Asistente Legal", area: "Corporativo" },
    { username: "rflores", password: "Operativo5", nombre: "Ricardo Flores", rol: "empleado", cargo: "Recepción", area: "Administración" },
    { username: "ppineda", password: "Operativo6", nombre: "Patricia Pineda", rol: "empleado", cargo: "Contabilidad", area: "Administración" },
    { username: "esantos", password: "Operativo7", nombre: "Ernesto Santos", rol: "empleado", cargo: "Mensajería / Notificador", area: "Operaciones" },
];

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    
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
    nombre: user.nombre,
    rol: user.rol,
    cargo: user.cargo,
    area: user.area,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session && session.username && session.rol ? session : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// En React las vistas son rutas, no archivos .html.
export function routeForRole(rol) {
  return rol === 'admin' ? '/dashboard' : '/portal';
}