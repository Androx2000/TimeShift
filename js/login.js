/**
 * TimeShift — Conexión entre la Vista Login (diseño de Marcos) y el
 * módulo de autenticación TimeShiftAuth (auth.js).
 * Autor: Alan Enrique Ventura Hernández
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
  // Si ya hay sesión activa, saltar directo a su vista.
  TimeShiftAuth.initUsers();
  const sesionActiva = TimeShiftAuth.getSession();
  if (sesionActiva) {
    window.location.href = TimeShiftAuth.routeForRole(sesionActiva.rol);
    return;
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

  let rolSeleccionado = "trabajador"; // por defecto, según el HTML (aria-checked="true")

  // --- Selector de rol: mueve la píldora y actualiza aria-checked ---
  function moverPildora(boton) {
    if (!pildora || !boton) return;
    pildora.style.width = `${boton.offsetWidth}px`;
    pildora.style.transform = `translateX(${boton.offsetLeft}px)`;
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

  // Posiciona la píldora correctamente al cargar (por si el CSS no la ubica sola)
  window.addEventListener("load", () => moverPildora(btnTrabajador));

  // --- Mostrar / ocultar contraseña ---
  if (btnAlternarClave) {
    btnAlternarClave.addEventListener("click", () => {
      const mostrando = claveInput.type === "text";
      claveInput.type = mostrando ? "password" : "text";
      btnAlternarClave.setAttribute("aria-pressed", String(!mostrando));
      btnAlternarClave.setAttribute(
        "aria-label",
        mostrando ? "Mostrar contraseña" : "Ocultar contraseña"
      );
    });
  }

  // --- Mensajes de feedback (usa los colores 'fallo' y 'acuerdo' del tema) ---
  function mostrarMensaje(texto, tipo = "fallo") {
    mensajeLogin.textContent = texto;
    mensajeLogin.classList.remove("hidden", "text-fallo", "text-acuerdo");
    mensajeLogin.classList.add(
      "text-sm",
      "font-medium",
      tipo === "fallo" ? "text-fallo" : "text-acuerdo"
    );
  }

  function ocultarMensaje() {
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

    if (!validarCampos()) return; // Bloquea el envío si hay campos inválidos

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
