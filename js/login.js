/**
 * TimeShift — Conexión entre la Vista Login (diseño de Marcos) y el
 * módulo de autenticación TimeShiftAuth (auth.js).
 * Autor: Alan Enrique Ventura Hernández (Ajustes de UI integrados)
 *
 * Requiere que index.html cargue js/auth.js ANTES que este archivo:
 *   <script src="js/auth.js"></script>
 *   <script src="js/login.js"></script>
 */

// El diseño usa "trabajador" para el toggle visual; internamente los
// usuarios se guardan con rol "empleado" (ver DEFAULT_USERS en auth.js).
const MAPA_ROLES = {
  trabajador: "empleado",
  admin: "admin",
};

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // 0. Reloj Analógico TimeShift (Movimiento continuo fluido Apple)
  // =========================================================================
  const agujaHora = document.getElementById("aguja-hora");
  const agujaMinuto = document.getElementById("aguja-minuto");
  const agujaSegundo = document.getElementById("aguja-segundo");
  const prefiereReduccionMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function actualizarReloj() {
    const ahora = new Date();
    const ms = ahora.getMilliseconds();
    const s = ahora.getSeconds();
    const m = ahora.getMinutes();
    const h = ahora.getHours() % 12;

    const segundoFraccional = prefiereReduccionMovimiento ? s : s + ms / 1000;
    const minutoFraccional = m + segundoFraccional / 60;
    const horaFraccional = h + minutoFraccional / 60;

    if (agujaSegundo) agujaSegundo.style.transform = `rotate(${segundoFraccional * 6}deg)`;
    if (agujaMinuto)  agujaMinuto.style.transform  = `rotate(${minutoFraccional * 6}deg)`;
    if (agujaHora)    agujaHora.style.transform    = `rotate(${horaFraccional * 30}deg)`;

    if (!prefiereReduccionMovimiento) {
      requestAnimationFrame(actualizarReloj);
    }
  }

  if (prefiereReduccionMovimiento) {
    setInterval(actualizarReloj, 1000);
    actualizarReloj();
  } else {
    requestAnimationFrame(actualizarReloj);
  }

  // =========================================================================
  // 1. Verificación de sesión previa (con protección si auth.js no ha cargado)
  // =========================================================================
  if (typeof TimeShiftAuth !== "undefined") {
    TimeShiftAuth.initUsers();
    const sesionActiva = TimeShiftAuth.getSession();
    if (sesionActiva) {
      window.location.href = TimeShiftAuth.routeForRole(sesionActiva.rol);
      return;
    }
  }

  // --- Referencias a elementos del diseño de Marcos ---
  const form = document.getElementById("form-login");
  const usuarioInput = document.getElementById("usuario");
  const claveInput = document.getElementById("clave");
  const mensajeLogin = document.getElementById("mensaje-login");

  const btnTrabajador = document.getElementById("btn-rol-trabajador");
  const btnAdmin = document.getElementById("btn-rol-admin");
  const pildora = document.getElementById("pildora-deslizante");

  const btnAlternarClave = document.getElementById("alternar-clave");
  const iconoOjo = document.getElementById("icono-ojo");

  let rolSeleccionado = "trabajador"; // por defecto, según el HTML

  // --- Selector de rol: mueve la píldora y actualiza aria-checked ---
  function moverPildora(boton) {
    if (!pildora || !boton) return;
    const paddingContenedor = parseFloat(getComputedStyle(pildora.parentElement).paddingLeft) || 4;
    pildora.style.width = `${boton.offsetWidth}px`;
    pildora.style.transform = `translateX(${boton.offsetLeft - paddingContenedor}px)`;
  }

  function seleccionarRol(rol) {
    rolSeleccionado = rol;
    const esTrabajador = rol === "trabajador";

    btnTrabajador.classList.toggle("activo", esTrabajador);
    btnAdmin.classList.toggle("activo", !esTrabajador);
    btnTrabajador.setAttribute("aria-checked", String(esTrabajador));
    btnAdmin.setAttribute("aria-checked", String(!esTrabajador));

    moverPildora(esTrabajador ? btnTrabajador : btnAdmin);
    ocultarMensaje();
  }

  btnTrabajador.addEventListener("click", () => seleccionarRol("trabajador"));
  btnAdmin.addEventListener("click", () => seleccionarRol("admin"));

  // Posiciona la píldora correctamente al cargar
  window.addEventListener("load", () => moverPildora(btnTrabajador));

  // --- Mostrar / ocultar contraseña con cambio de SVG dinámico ---
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

  if (btnAlternarClave && claveInput) {
    btnAlternarClave.addEventListener("click", () => {
      const mostrando = claveInput.type === "text";
      claveInput.type = mostrando ? "password" : "text";
      btnAlternarClave.setAttribute("aria-pressed", String(!mostrando));
      btnAlternarClave.setAttribute(
        "aria-label",
        mostrando ? "Mostrar contraseña" : "Ocultar contraseña"
      );
      if (iconoOjo) {
        iconoOjo.innerHTML = mostrando ? ojoAbierto : ojoCerrado;
      }
    });
  }

  // --- Mensajes de feedback con estilos de tarjeta y rebote Apple ---
  function mostrarMensaje(texto, tipo = "fallo") {
    if (!mensajeLogin) return;
    mensajeLogin.textContent = texto;
    mensajeLogin.className = tipo === "fallo"
      ? "alerta-apple-error rounded-2xl px-4 py-3 text-xs font-medium"
      : "alerta-apple-exito rounded-2xl px-4 py-3 text-xs font-medium";
    mensajeLogin.classList.remove("hidden");
  }

  function ocultarMensaje() {
    if (!mensajeLogin) return;
    mensajeLogin.classList.add("hidden");
  }

  // --- Validación y envío ---
  function marcarCampo(input, esValido) {
    input.classList.toggle("ring-2", !esValido);
    input.classList.toggle("ring-fallo", !esValido);
  }

  function validarCampos() {
    const usuarioOk = usuarioInput.value.trim().length > 0;
    const claveOk = claveInput.value.length >= 8;

    marcarCampo(usuarioInput, usuarioOk);
    marcarCampo(claveInput, claveOk);

    if (!usuarioOk) {
      mostrarMensaje("Ingresa tu usuario.");
      return false;
    }
    if (!claveOk) {
      mostrarMensaje("La contraseña debe tener mínimo 8 caracteres.");
      return false;
    }
    return true;
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    ocultarMensaje();

    if (!validarCampos()) return;

    if (typeof TimeShiftAuth === "undefined") {
      mostrarMensaje("Error: el módulo de autenticación no está disponible.");
      return;
    }

    const cuenta = TimeShiftAuth.verifyCredentials(
      usuarioInput.value.trim(),
      claveInput.value
    );

    if (!cuenta) {
      mostrarMensaje("Usuario o contraseña incorrectos.");
      return;
    }

    const rolEsperado = MAPA_ROLES[rolSeleccionado];
    if (cuenta.rol !== rolEsperado) {
      mostrarMensaje(
        `Esta cuenta no corresponde al acceso "${rolSeleccionado === "admin" ? "Admin" : "Usuario"}".`
      );
      return;
    }

    mostrarMensaje("Acceso correcto, redirigiendo…", "acuerdo");
    TimeShiftAuth.createSession(cuenta);
    setTimeout(() => {
      window.location.href = TimeShiftAuth.routeForRole(cuenta.rol);
    }, 400);
  });
});