document.addEventListener('DOMContentLoaded', () => {
  // 1. Selector de Rol con pastilla deslizante física
  const pildora = document.getElementById('pildora-deslizante');
  const btnUsuario = document.getElementById('btn-rol-trabajador');
  const btnAdmin = document.getElementById('btn-rol-admin');
  let rolSeleccionado = 'trabajador';

  function cambiarRol(rol) {
    if (rol === rolSeleccionado) return;
    rolSeleccionado = rol;

    const esAdmin = rol === 'admin';

    // Desplazamiento elastico de la cápsula
    if (pildora) {
      pildora.style.transform = esAdmin ? 'translateX(100%)' : 'translateX(0%)';
    }

    // Actualización de estado y ARIA
    if (btnUsuario && btnAdmin) {
      btnUsuario.setAttribute('aria-checked', !esAdmin);
      btnAdmin.setAttribute('aria-checked', esAdmin);

      btnUsuario.classList.toggle('activo', !esAdmin);
      btnAdmin.classList.toggle('activo', esAdmin);
    }
  }

  if (btnUsuario) btnUsuario.addEventListener('click', () => cambiarRol('trabajador'));
  if (btnAdmin) btnAdmin.addEventListener('click', () => cambiarRol('admin'));

  // 2. Alternar visibilidad de contraseña
  const inputClave = document.getElementById('clave');
  const btnAlternarClave = document.getElementById('alternar-clave');
  const iconoOjo = document.getElementById('icono-ojo');

  const ojoAbierto = `
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  `;

  const ojoCerrado = `
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  `;

  if (btnAlternarClave && inputClave && iconoOjo) {
    btnAlternarClave.addEventListener('click', () => {
      const esPassword = inputClave.type === 'password';
      inputClave.type = esPassword ? 'text' : 'password';
      btnAlternarClave.setAttribute('aria-pressed', esPassword ? 'true' : 'false');
      btnAlternarClave.setAttribute('aria-label', esPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');

      iconoOjo.style.transform = 'scale(0.85)';
      setTimeout(() => {
        iconoOjo.innerHTML = esPassword ? ojoCerrado : ojoAbierto;
        iconoOjo.style.transform = 'scale(1)';
      }, 80);
    });
  }

  // 3. Manejo de formulario y feedback eltastico
  const form = document.getElementById('form-login');
  const msg = document.getElementById('mensaje-login');
  const inputUsuario = document.getElementById('usuario');
  const btnSubmit = document.getElementById('btn-submit');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const usuario = inputUsuario ? inputUsuario.value.trim() : '';
      const clave = inputClave ? inputClave.value.trim() : '';

      ocultarMensaje();

      if (!usuario || !clave) {
        mostrarMensaje('Por favor ingrese usuario y contraseña.', 'error');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        const textoOriginal = btnSubmit.textContent;
        btnSubmit.textContent = 'Verificando...';

        setTimeout(() => {
          btnSubmit.disabled = false;
          btnSubmit.textContent = textoOriginal;

          if (usuario.toLowerCase() === 'demo' || usuario.includes('.')) {
            mostrarMensaje(`Bienvenido al sistema (${rolSeleccionado.toUpperCase()}).`, 'exito');
          } else {
            mostrarMensaje('Usuario o contraseña no válidos.', 'error');
          }
        }, 550);
      }
    });
  }

  function mostrarMensaje(texto, tipo) {
    if (!msg) return;
    msg.className = tipo === 'exito'
      ? 'alerta-apple-exito rounded-2xl px-4 py-3 text-xs font-medium'
      : 'alerta-apple-error rounded-2xl px-4 py-3 text-xs font-medium';
    msg.textContent = texto;
    msg.classList.remove('hidden');
  }

  function ocultarMensaje() {
    if (!msg) return;
    msg.classList.add('hidden');
    msg.className = 'hidden';
  }
});