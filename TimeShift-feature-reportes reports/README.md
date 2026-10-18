# Sistema de Control de Asistencia y Gestión de Turnos (TimeShift)

## ETAPA 2: DESARROLLO BASE DEL PROYECTO

### Integrantes del Proyecto:
- **Boris Armando Campos López** - `CL253217`
- **Diego Humberto Márquez Valencia** - `MV262624`
- **Marcos Abdulio López Alvarado** - `LA211485`
- **Alan Enrique Ventura Hernández** - `VH262707`

---

## 1. Descripción General del Sistema

**TimeShift** es una solución web para la gestión de asistencia, turnos y monitoreo operativo en tiempo real de colaboradores y personal judicial/administrativo.

El sistema permite a los administradores:
1. Supervisar en vivo el estado y permanencia de cada empleado (En Tribunal, Disponible, Reunión con Cliente, Almuerzo/Descanso, Fin de Turno).
2. Analizar tendencias de cumplimiento, puntualidad y métricas de rendimiento con gráficos analíticos.
3. Administrar el catálogo de empleados (altas y bajas de personal de forma interactiva).
4. Consultar el historial detallado de marcaciones de un empleado específico con etiquetas semánticas de color según su estado de asistencia (Puntual, Tardanza, Ausencia Justificada, Falta Injustificada y Salida Anticipada).
5. Ajustar reglas globales de turnos, límites de inactividad y códigos de estado auxiliar (AUX).

---

## 2. Estructura de Archivos del Proyecto

```text
TimeShift-feat-dashboard-admin/
│
├── index.html                 # Punto de entrada inicial (redirección a dashboard.html)
├── dashboard.html             # Panel principal de administración y monitoreo en vivo
├── gestion de datos.html      # Módulo para altas/bajas de personal e historial de marcaciones
├── README.md                  # Manual técnico y explicativo del proyecto
│
└── js/
    ├── dashboard.js           # Lógica interactiva del panel de control (gráficos, vistas, tooltips)
    ├── gestion-datos.js       # Lógica de gestión de empleados, altas/bajas, historial y localStorage
    └── app.js                 # Scripts base auxiliares
```

---

## 3. Explicación Detallada del Código: `dashboard.html` y `js/dashboard.js`

El archivo `dashboard.html` es el núcleo de visualización del administrador. Utiliza **Tailwind CSS (CDN)** para maquetación rápida y responsiva, **Chart.js** para visualización de datos y la API de **DiceBear** para avatares pixelados generados dinámicamente.

A continuación se desglosa cada componente y cómo opera:

### 3.1. Configuración de Tailwind y Tipografía (`<head>`)
- Se importa la fuente Google Sans e IBM Plex Mono para el diseño numérico e institucional.
- Se extiende el tema de Tailwind mediante `tailwind.config` para definir colores del sistema:
  - `primary: "#FF5701"`: Color de acento naranja TimeShift.
  - `brandBlue: "#1e3a8a"`: Azul marino institucional.
  - `success: "#16A34A"`: Verde para estados activos y cumplimientos.
  - `warning: "#D97706"`: Ámbar para reuniones y avisos.
  - `danger: "#DC2626"`: Rojo para fin de turno y faltas.
- Se configuran clases utilitarias personalizadas para los botones toggle (`.toggle-checkbox:checked`).

### 3.2. Encabezado Responsivo y Menú Superior (`<header>`)
- **Diseño**: Fondo `#111827` (slate oscuro), `sticky top-0` con `z-50` para mantenerse fijo al hacer scroll.
- **Identidad de Marca**: Título "TimeShift" junto a la etiqueta visual `Admin`.
- **Navegación Dinámica (`#main-nav`)**:
  - Enlaces con atributo `data-target="view-monitor"`, `data-target="view-reports"`, etc.
  - Enlace directo con indicador pulsante a la página de **Gestión de Datos** (`gestion de datos.html`).
- **Avatar de Usuario**: Imagen de perfil obtenida dinámicamente mediante DiceBear:
  ```html
  <img src="https://api.dicebear.com/10.x/pixelbot/svg?seed=Juan+Pablo&backgroundColor=1e293b">
  ```

### 3.3. Sistema de Cambio de Vistas en JavaScript (`switchView`)
En `js/dashboard.js`, la función `switchView(targetId)` maneja la navegación por pestañas de forma fluida y sin recargar la página:
```javascript
function switchView(targetId) {
    // 1. Resalta el enlace activo en blanco y atenúa los demás a gris (text-slate-400)
    navLinks.forEach(link => {
        if (link.dataset.target === targetId) {
            link.classList.remove('text-slate-400');
            link.classList.add('text-white');
        } else {
            link.classList.add('text-slate-400');
            link.classList.remove('text-white');
        }
    });

    // 2. Oculta todas las secciones (.view-section) con la clase 'hidden'
    //    y muestra únicamente la sección cuyo id coincide con targetId ('block')
    viewSections.forEach(section => {
        if (section.id === targetId) {
            section.classList.remove('hidden');
            section.classList.add('block');
        } else {
            section.classList.add('hidden');
            section.classList.remove('block');
        }
    });
}
```

### 3.4. Vista 1: Monitor en Tiempo Real (`#view-monitor`)
1. **Tarjetas KPI Superiores**:
   - **Personal Activo** (24): Color verde (`text-success`).
   - **Fuera de la Oficina** (8): Color ámbar (`text-warning`).
   - **Ausente** (3): Color rojo (`text-danger`).
2. **Tabla de Empleados en Vivo (`#employee-table-body`)**:
   - Cada fila muestra: Foto, Nombre, Correo, Departamento, Etiqueta de Estado y Tiempo en Estado (con tipografía monospace).
   - Los datos se sincronizan con `localStorage` (`timeshift_employees_data`); si no existen, toma la lista predeterminada.
3. **Gráfica de Dona (`#timeDistributionChart`) y Tooltip Flotante Personalizado**:
   - Emplea un gráfico tipo `doughnut` de Chart.js con un corte central del 75% (`cutout: '75%'`) que muestra un contador en medio.
   - **Técnica Especial: `externalTooltipHandler`**: Los tooltips nativos de canvas suelen quedar recortados por los bordes del contenedor. TimeShift implementa un tooltip en HTML puro insertado directamente en el `document.body` con posición absoluta y `z-[9999]`:
     ```javascript
     const isRightHalf = tooltip.caretX > (chart.width / 2);
     if (isRightHalf) {
         tooltipEl.style.transform = 'translate(15px, -50%)';
     } else {
         tooltipEl.style.transform = 'translate(calc(-100% - 15px), -50%)';
     }
     ```
     Esto garantiza que el tooltip se posicione inteligentemente fuera de la dona sin tapar la información.

### 3.5. Vista 2: Reportes y Analíticas (`#view-reports`)
1. **Filtro Temporal y Exportación**: Botones con iconos SVG para exportar a **PDF** y **XLSX**.
2. **Tarjetas de Cumplimiento**:
   - Tasa Promedio de Cumplimiento: `94.2% (+1.4%)`.
   - Horas Productivas: `1,842h (+5.2%)`.
   - Incidentes de Incumplimiento: `18 (-12%)`.
   - Duración Promedio Turno AUX: `48m`.
3. **Gráfico de Barras (`adherenceBarChart`)**:
   - Muestra el porcentaje de adherencia diaria de lunes a domingo.
   - Eje Y formateado con el símbolo de porcentaje (`%`).
4. **Desglose de Estados AUX**:
   - Barras de progreso con porcentajes de distribución de tiempo (En Tribunal 45%, Disponible 30%, Reunión con Cliente 15%, Almuerzo 10%).
5. **Tabla de Desviaciones de Horario (`#adherence-table-body`)**:
   - Compara el estado programado contra el real (ej. *Programado: Disponible* vs *Real: En Tribunal (Atrasado)*) e indica la desviación en minutos (`+35 min`).

### 3.6. Vista 3: Directorio de Personal (`#view-directory`)
- Permite buscar empleados y filtrar por departamento o estado.
- El botón **`+ Agregar Empleado`** redirige a `gestion de datos.html?action=new` abriendo directamente el modal de registro.
- En la tabla de empleados, el enlace **`Ver Registros`** redirige a `gestion de datos.html?empId=[ID]` para cargar el historial de ese colaborador.

### 3.7. Vista 4: Configuración (`#view-settings`)
- **Reglas Globales**: Objetivo de turno por defecto (`08:00:00`), minutos de inactividad (`15`), alertas de desviación y cierre de sesión forzado.
- **Gestor de Estados AUX**: Lista de estados activables/desactivables mediante interruptores personalizados estilo iOS.

---

## 4. Explicación de la Página `gestion de datos.html` y `js/gestion-datos.js`

Esta página amplía las capacidades operativas del sistema, permitiendo administrar el catálogo del personal y auditar las marcaciones individuales.

### 4.1. Módulo para Agregar y Quitar Gente

#### A) Agregar Nuevo Empleado (`openAddModal` y `formAdd`)
1. El usuario hace clic en el botón principal **`+ Registrar Nuevo Empleado`**.
2. Se abre un modal con validación que solicita:
   - Nombre completo.
   - Correo electrónico corporativo.
   - Cargo o puesto asignado.
   - Departamento (Operaciones, Asesoría Legal, Personal Ejecutivo, Estrategia, Administración, Tecnología).
   - Turno asignado (Diurno 08:00-17:00, Matutino, etc.).
   - Estado inicial del empleado.
3. Al enviar el formulario:
   - El sistema genera un identificador único en formato correlativo (`TS-007`, `TS-008`...).
   - Asigna un avatar DiceBear a partir del nombre ingresado.
   - Agrega el empleado al arreglo en memoria y lo guarda en `localStorage` (`timeshift_employees_data`).
   - Inicializa automáticamente un registro de marcación de bienvenida para el nuevo colaborador.
   - Actualiza los contadores KPI (Total de personal, activos, departamentos) y emite un toast de notificación.

#### B) Quitar / Eliminar Empleado (`openDeleteModal` y `btnConfirmDelete`)
1. En la fila de cada empleado existe el botón **`Eliminar`**.
2. Al presionarlo, se despliega un modal de confirmación con alerta visual y un resumen de los datos del empleado (Nombre, ID, Departamento, Cargo).
3. Si el usuario confirma la baja:
   - El registro se remueve de `localStorage`.
   - Se actualizan las tablas y los contadores en tiempo real.
   - Si el empleado eliminado estaba cargado en el historial de marcaciones, el sistema conmuta automáticamente al siguiente disponible.
   - Se muestra un toast confirmando la eliminación segura.

#### C) Búsqueda y Filtros en Tiempo Real
- El campo de texto filtra de manera instantánea por nombre, cargo, correo o ID (`TS-XXX`).
- Selectores dinámicos para filtrar simultáneamente por **Departamento** y **Estado de Turno**.

---

### 4.2. Tabla de Historial de Marcaciones de Empleado Específico

Al seleccionar un empleado (mediante el selector desplegable, haciendo clic en **"Ver Marcaciones"** en la tabla de personal, o viniendo desde `dashboard.html`), se carga la vista de detalle:

#### A) Ficha de Perfil del Colaborador
Muestra:
- Avatar DiceBear a gran tamaño con marco corporativo.
- Nombre completo, identificador único `TS-XXX` y etiqueta de estado en vivo.
- Cargo, departamento, correo corporativo y horario asignado.
- **Tarjetas de Estadísticas Individuales**:
  1. **Días Registrados**: Número total de marcaciones registradas.
  2. **Tasa de Puntualidad**: Porcentaje de días en que llegó puntual vs retrasos/faltas.
  3. **Retrasos**: Cantidad de llegadas tardías en el período.
  4. **Minutos Acumulados de Retraso**: Total de tiempo a justificar o recuperar.

#### B) Tabla de Marcaciones e Indicadores
Columnas de la tabla:
1. **Fecha**: Formato día/mes/año con indicador luminoso.
2. **Hora de Entrada**: Hora exacta en formato `HH:mm:ss`.
3. **Pausas / AUX**: Tiempo consumido en almuerzo o salidas auxiliares.
4. **Hora de Salida**: Hora de fin de jornada o estado *"En turno"*.
5. **Horas Efectivas**: Tiempo neto trabajado con tipografía monospace (`8h 15m`).
6. **Estado de Asistencia**: Etiqueta semántica de color (badge).
7. **Observaciones / Justificaciones**: Notas de auditoría, permisos o motivos de retraso.

#### C) Sistema y Guía de Etiquetas de Color (Badges)
Para una rápida lectura visual, cada marcación cuenta con estilos CSS definidos:

| Estado | Color Principal | Clases CSS / Estilo | Significado Operativo |
| :--- | :--- | :--- | :--- |
| **Puntual** | 🟢 Verde Esmeralda | `bg-emerald-50 text-emerald-700 border-emerald-500` | Ingreso dentro del horario programado o tolerancia. |
| **Tardanza** | 🟡 Ámbar / Naranja | `bg-amber-50 text-amber-700 border-amber-500` | Llegada con retraso superior a 5 min. Muestra los minutos acumulados `(+Xm)`. |
| **Ausencia Justificada**| 🔵 Azul Institucional | `bg-blue-50 text-blue-700 border-blue-600` | Permiso de trabajo, cita médica o comisión con constancia RH. |
| **Falta Injustificada** | 🔴 Rojo Peligro | `bg-red-50 text-red-700 border-red-600` | Inasistencia no comunicada ni autorizada. |
| **Salida Anticipada** | 🟠 Naranja Alerta | `bg-orange-50 text-orange-700 border-orange-500` | Retiro antes de la culminación de la jornada oficial. |

#### D) Registro de Marcación Manual
Incluye un modal que permite al administrador registrar manualmente una asistencia extraordinaria, ajustando fecha, horas de entrada/salida, estado y la justificación correspondiente.

---

## 5. Interconexión entre `dashboard.html` y `gestion de datos.html`

Ambas páginas operan como un sistema integrado:
1. **Menú de Cabecera**: Permite saltar entre el Dashboard principal y Gestión de Datos con un solo clic.
2. **Botón "+ Agregar Empleado" del Dashboard**: Redirige a `gestion de datos.html?action=new`, disparando inmediatamente el modal de registro de nuevo personal.
3. **Botón "Ver Registros" en el Directorio**: Envía el ID del empleado en la URL (ej. `gestion de datos.html?empId=TS-002`), cargando su ficha y su tabla de marcaciones sin pasos intermedios.
4. **Persistencia Sincronizada**: Ambas páginas comparten las claves `timeshift_employees_data` y `timeshift_punches_data` en `localStorage`, asegurando consistencia de datos en todo el navegador.

---

## 6. Instrucciones de Ejecución

1. Descarga o clona el repositorio en tu equipo.
2. Abre la carpeta del proyecto:
   ```text
   TimeShift-feat-dashboard-admin/
   ```
3. Para iniciar la aplicación, puedes:
   - **Opción A (Directa)**: Hacer doble clic en `index.html` o `dashboard.html` para abrirlo en cualquier navegador moderno (Google Chrome, Microsoft Edge, Firefox, etc.).
   - **Opción B (Servidor Local)**: Si usas Visual Studio Code, haz clic derecho sobre `dashboard.html` y selecciona **"Open with Live Server"**.
4. ¡Listo! Puedes agregar o dar de baja colaboradores, navegar entre las vistas y auditar los registros de marcación con sus respectivas etiquetas de color.
