// login.js — maquetación base, sin lógica de autenticación real todavía
// (la validación contra los 9 usuarios y el enrutamiento por rol los agrega
// el módulo de Autenticación, Roles y Vista Login del equipo)

document.addEventListener('DOMContentLoaded', () => {
  const botonesRol   = document.querySelectorAll('[data-rol]');
  const alternarClave = document.getElementById('alternar-clave');
  const campoClave    = document.getElementById('clave');
  const iconoOjo       = document.getElementById('icono-ojo');
  const formulario     = document.getElementById('form-login');
  const mensajeLogin   = document.getElementById('mensaje-login');

  let rolSeleccionado = 'trabajador';

  // ── Selector de rol (Trabajador / Administrador) ──
  botonesRol.forEach((boton) => {
    boton.addEventListener('click', () => {
      rolSeleccionado = boton.dataset.rol;

      botonesRol.forEach((b) => {
        const activo = b === boton;
        b.classList.toggle('rol-tecla-activa', activo);
        b.classList.toggle('text-grafito', !activo);
        b.setAttribute('aria-checked', String(activo));
      });
    });
  });

  // ── Mostrar / ocultar contraseña ──
  alternarClave.addEventListener('click', () => {
    const visible = campoClave.type === 'text';
    campoClave.type = visible ? 'password' : 'text';
    alternarClave.setAttribute('aria-pressed', String(!visible));
    alternarClave.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');

    // Ojo tachado cuando la contraseña está visible
    iconoOjo.innerHTML = visible
      ? '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="21" x2="21" y2="3"/>';
  });

  // ── Envío del formulario (placeholder hasta que se conecte la validación real) ──
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    mensajeLogin.classList.add('hidden');

    const usuario = document.getElementById('usuario').value.trim();
    const clave   = campoClave.value;

    if (!usuario || !clave) {
      mensajeLogin.textContent = 'Complete usuario y contraseña.';
      mensajeLogin.classList.remove('hidden');
      return;
    }

    // TODO (equipo): validar contra los usuarios predefinidos en localStorage
    // y enrutar según rolSeleccionado ('trabajador' -> portal.html, 'admin' -> panel-admin.html)
    console.log('Intento de inicio de sesión:', { usuario, rol: rolSeleccionado });
  });
});
