// src/data/usuarios.js
// Única fuente de los usuarios de demostración de TimeShift: la usan el Login,
// el Portal y el Monitor, y la siembra services/auth.js. Los departamentos son
// los que acepta el Directorio (ver DEPARTAMENTOS en services/empleados.js).

export const USUARIOS_DEMO = [
  { username: 'jalvarado', password: 'Jovita2026', role: 'admin', name: 'Jovita Alvarado', cargo: 'Dueña', departamento: 'Personal Ejecutivo' },
  { username: 'cgerente', password: 'Gerente2026', role: 'admin', name: 'Carlos Guevara', cargo: 'Gerente', departamento: 'Administración' },
  { username: 'aruiz', password: 'Operativo1', role: 'empleado', name: 'Andrea Ruiz', cargo: 'Abogada Litigante', departamento: 'Asesoría Legal' },
  { username: 'mportillo', password: 'Operativo2', role: 'empleado', name: 'Marcela Portillo', cargo: 'Abogada Corporativa', departamento: 'Asesoría Legal' },
  { username: 'jhenriquez', password: 'Operativo3', role: 'empleado', name: 'Javier Henríquez', cargo: 'Asistente Legal', departamento: 'Asesoría Legal' },
  { username: 'lcastro', password: 'Operativo4', role: 'empleado', name: 'Luis Castro', cargo: 'Asistente Legal', departamento: 'Asesoría Legal' },
  { username: 'rflores', password: 'Operativo5', role: 'empleado', name: 'Roxana Flores', cargo: 'Recepción', departamento: 'Administración' },
  { username: 'ppineda', password: 'Operativo6', role: 'empleado', name: 'Patricia Pineda', cargo: 'Contabilidad', departamento: 'Administración' },
  { username: 'esantos', password: 'Operativo7', role: 'empleado', name: 'Eduardo Santos', cargo: 'Mensajería / Notificador', departamento: 'Operaciones' },
];
