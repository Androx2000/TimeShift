document.addEventListener('DOMContentLoaded', () => {
  // 1. Selector de Rol
  const teclasRol = document.querySelectorAll('.rol-tecla');
  let rolSeleccionado = 'trabajador';

  teclasRol.forEach((tecla) => {
    tecla.addEventListener('click', () => {
      const nuevoRol = tecla.getAttribute('data-rol');
      if (nuevoRol === rolSeleccionado) return;

      rolSeleccionado = nuevoRol;

      teclasRol.forEach((btn) => {
        const esActivo = btn === tecla;
        btn.setAttribute('aria-checked', esActivo ? 'true' : 'false');
        if (esActivo) {
          btn.classList.add('rol-tecla-activa');
          btn.classList.remove('text-grafito');
        } else {
          btn.classList.remove('rol-tecla-activa');
          btn.classList.add('text-grafito');
        }
      });
    });
  });

  // 2. Alternar visibilidad de contraseña
  const inputClave = document.getElementById('clave');
  const btnAlternarClave = document.getElementById('alternar-clave');
  const iconoOjo = document.getElementById('icono-ojo');

  const iconoOjoAbierto = `
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  `;

  const iconoOjoCerrado = `
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
      iconoOjo.innerHTML = esPassword ? iconoOjoCerrado : iconoOjoAbierto;
    });
  }

  // 3. Envío y Validación del formulario
  const formLogin = document.getElementById('form-login');
  const mensajeLogin = document.getElementById('mensaje-login');
  const inputUsuario = document.getElementById('usuario');
  const btnSubmit = formLogin ? formLogin.querySelector('button[type="submit"]') : null;

  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();

      const usuario = inputUsuario ? inputUsuario.value.trim() : '';
      const clave = inputClave ? inputClave.value.trim() : '';

      // Ocultar mensaje previo
      mensajeLogin.classList.add('hidden');
      mensajeLogin.classList.remove('alerta-shake');

      // Validación simple para prueba
      if (!usuario || !clave) {
        mostrarError('Por favor complete todos los campos requeridos.');
        return;
      }

      // Simulación de autenticación
      if (btnSubmit) {
        btnSubmit.disabled = true;
        const textoOriginal = btnSubmit.textContent;
        btnSubmit.textContent = 'Verificando...';
        btnSubmit.classList.add('opacity-80');

        setTimeout(() => {
          btnSubmit.disabled = false;
          btnSubmit.textContent = textoOriginal;
          btnSubmit.classList.remove('opacity-80');

          // Si el usuario pone "demo" y clave "demo", simula éxito
          if (usuario.toLowerCase() === 'demo' || (usuario.includes('.') && clave.length >= 4)) {
            mensajeLogin.className = 'rounded-lg border border-acuerdo/30 bg-acuerdo/10 px-3 py-2 text-sm text-acuerdo';
            mensajeLogin.textContent = `¡Bienvenido al sistema TimeShift (${rolSeleccionado})!`;
            mensajeLogin.classList.remove('hidden');
          } else {
            mostrarError('Usuario o contraseña incorrectos.');
          }
        }, 600);
      }
    });
  }

  function mostrarError(texto) {
    if (!mensajeLogin) return;
    mensajeLogin.className = 'rounded-lg border border-fallo/30 bg-fallo/10 px-3 py-2 text-sm text-fallo alerta-shake';
    mensajeLogin.textContent = texto;
    mensajeLogin.classList.remove('hidden');
  }
});
