/**
 * TimeShift — Módulo de Autenticación, Roles y Sesiones
 * Autor: Alan Enrique Ventura Hernández
 * Etapa 2 — Todo el almacenamiento es simulado con localStorage (sin backend real).
 *
 * Este archivo se incluye en index.html y puede reutilizarse en cualquier
 * vista protegida (dashboard.html, portal.html, historial-empleado.html)
 * llamando a TimeShiftAuth.requireSession('admin' | 'empleado').
 */

const TimeShiftAuth = (() => {
  const USERS_KEY = "timeshift_users";
  const SESSION_KEY = "timeshift_session";

  // 9 usuarios predefinidos de la Oficina Jurídica Jovita Alvarado
  // (1 dueño, 1 gerente, 7 operativos), según la estructura definida en la Etapa 1.
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

  /** Crea el "seed" de usuarios en localStorage la primera vez que se ejecuta la app. */
  function initUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    }
  }

  function getUsers() {
    initUsers();
    return JSON.parse(localStorage.getItem(USERS_KEY));
  }

  /**
   * Verifica credenciales contra los usuarios guardados en localStorage.
   * @returns {object|null} el usuario si coincide, o null si no.
   */
  function verifyCredentials(username, password) {
    const users = getUsers();
    const found = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    return found || null;
  }

  /** Guarda la sesión activa simulada en localStorage. */
  function createSession(user) {
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

  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
  }

  /**
   * Devuelve la vista a la que debe enrutarse cada rol tras autenticarse.
   * Admin y empleado inician sesión con usuario/contraseña (ya no hay
   * ingreso por PIN/Kiosk); cada rol cae en su propia vista.
   */
  function routeForRole(rol) {
    if (rol === "admin") return "dashboard.html";
    if (rol === "empleado") return "portal.html";
    return "index.html";
  }

  /**
   * Guardia de acceso para páginas protegidas: si no hay sesión, o el rol
   * no coincide con el requerido, redirige al login.
   * Uso: TimeShiftAuth.requireSession('admin');
   */
  function requireSession(expectedRole) {
    const session = getSession();
    if (!session || (expectedRole && session.rol !== expectedRole)) {
      window.location.href = "index.html";
      return null;
    }
    return session;
  }

  return {
    initUsers,
    getUsers,
    verifyCredentials,
    createSession,
    getSession,
    logout,
    routeForRole,
    requireSession,
  };
})();
