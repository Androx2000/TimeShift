# TimeShift
## Sistema Web de Control de Asistencia y Gestión de Turnos

**Universidad Don Bosco — Desarrollo de Aplicaciones Web con Software Interpretado en el Cliente (DAW901)**

**Etapa 3 — Avance 1: Interactividad y Componentes Dinámicos**

### Integrantes del proyecto

- Boris Armando Campos López — CL253217
- Diego Humberto Márquez Valencia — MV262624
- Marcos Abdulio López Alvarado — LA211485
- Alan Enrique Ventura Hernández — VH262707

---

## 1. Descripción general

**TimeShift** es una aplicación web diseñada para mejorar el control de asistencia, la administración de empleados y el monitoreo de estados laborales AUX.

El proyecto está orientado a la **Oficina Jurídica Jovita Alvarado**, con el propósito de facilitar el seguimiento de las jornadas y proporcionar información para la toma de decisiones administrativas.

El sistema permite consultar el estado actual de los empleados, administrar sus registros, visualizar estadísticas y generar informes descargables.

Para este avance se implementaron funcionalidades interactivas mediante JavaScript y librerías especializadas en visualización, validación y generación de reportes.

## 2. Objetivos

### Objetivo general

Desarrollar un sistema web interactivo que permita gestionar empleados, monitorear estados AUX y generar reportes de asistencia mediante tecnologías de desarrollo web del lado del cliente.

### Objetivos específicos

- Implementar indicadores y gráficas dinámicas.
- Registrar los cambios de estados AUX y calcular sus duraciones.
- Incorporar validaciones avanzadas y notificaciones interactivas.
- Facilitar la administración de empleados.
- Generar reportes descargables en CSV, Excel y PDF.
- Implementar navegación y acceso diferenciado según el rol del usuario.

## 3. Funcionalidades implementadas

### 3.1. Autenticación y roles

El sistema dispone de dos roles principales:

**Administrador:** puede acceder al dashboard, gestionar empleados y consultar reportes.

**Empleado:** puede acceder al portal personal y registrar cambios de estado AUX.

La autenticación es simulada mediante JavaScript y almacenamiento local. Esta solución corresponde a un prototipo académico y no debe considerarse un mecanismo de seguridad para producción.

### 3.2. Dashboard administrativo

Ubicación: `dashboard-v2/index.html`

Permite:

- Visualizar los cuatro estados AUX.
- Consultar indicadores del personal.
- Mostrar gráficas dinámicas con Chart.js.
- Buscar empleados por nombre.
- Filtrar empleados por estado AUX.
- Actualizar la información al detectar cambios en el almacenamiento local.
- Visualizar una interfaz adaptable a diferentes tamaños de pantalla.

### 3.3. Portal del empleado

Ubicación: `portal.html`

Permite seleccionar los siguientes estados:

| Estado AUX | Descripción |
|---|---|
| Disponible | Empleado disponible durante su jornada |
| Lunch | Tiempo destinado al almuerzo |
| Break | Período de descanso |
| Salida | Finalización de la jornada |

El sistema registra los períodos de actividad, incluyendo sus horas de inicio, finalización y duración.

### 3.4. Gestión de empleados

Ubicación: `gestion de datos.html`

Incluye:

- Registro de empleados.
- Edición de información.
- Eliminación de empleados.
- Validación de campos obligatorios.
- Validación de correos electrónicos.
- Comprobación de registros duplicados.
- Confirmaciones y notificaciones mediante SweetAlert2.
- Consulta y administración de información de asistencia.

### 3.5. Módulo de reportes

Ubicación: `reportes.html`

Ofrece:

- Consulta del historial AUX.
- Estadísticas de duración de estados.
- Gráficas con Chart.js.
- Filtros por empleado, estado, cargo y fechas.
- Exportación de registros en formato CSV.
- Exportación a Excel mediante SheetJS.
- Generación de documentos PDF mediante jsPDF y jsPDF-AutoTable.

Los reportes utilizan los registros almacenados en el sistema y no requieren generar datos ficticios automáticamente.

## 4. Tecnologías utilizadas

| Tecnología | Aplicación en TimeShift |
|---|---|
| HTML5 | Estructura de las páginas |
| CSS3 | Presentación y estilos |
| JavaScript | Lógica e interactividad |
| Tailwind CSS | Diseño de interfaces en módulos existentes |
| Chart.js | Gráficas e indicadores |
| SweetAlert2 | Alertas y confirmaciones |
| SheetJS | Exportaciones Excel |
| jsPDF | Generación de documentos PDF |
| jsPDF-AutoTable | Tablas dentro de documentos PDF |
| localStorage | Almacenamiento de datos del prototipo |
| Git y GitHub | Control de versiones y colaboración |

## 5. Estructura del proyecto

```text
TimeShift/
│
├── index.html
├── dashboard.html
├── portal.html
├── gestion de datos.html
├── reportes.html
├── README.md
│
├── dashboard-v2/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── CSS/
│   └── estilos.css
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── gestion-datos.js
│   ├── login.js
│   └── portal.js
│
└── docs/
    └── TimeShift_Foro1_Investigacion.pdf
```

**Nota:** La carpeta `docs/` corresponde al documento académico que debe incorporarse al repositorio. `dashboard.html` y `js/dashboard.js` se conservan como parte de la implementación anterior; el dashboard administrativo utilizado en este avance se encuentra en `dashboard-v2/`.

## 6. Instrucciones de ejecución

### Requisitos

- Navegador web actualizado.
- Visual Studio Code (recomendado).
- Extensión Live Server o servidor HTTP local.
- Conexión a Internet para cargar las librerías CDN.

### Procedimiento

1. Clonar el repositorio:

```bash
git clone https://github.com/Androx2000/TimeShift.git
```

2. Abrir la carpeta `TimeShift` en Visual Studio Code.

3. Abrir `index.html` mediante Live Server.

4. Iniciar sesión utilizando una cuenta de demostración configurada en el proyecto.

5. Acceder a las funcionalidades correspondientes al rol del usuario.

No es necesario ejecutar `npm install` para esta versión, ya que utiliza HTML, CSS y JavaScript con librerías cargadas mediante CDN.

## 7. Almacenamiento y funcionamiento

El prototipo utiliza `localStorage` para almacenar información como:

- `ts_employees`: empleados registrados y sus estados actuales.
- `ts_aux_logs`: historial de períodos AUX finalizados.
- `ts_punches`: registros de marcaciones.
- `timeshift_session`: información de sesión simulada.

Las distintas páginas del mismo origen y perfil de navegador pueden consultar estos datos.

**Limitación:** esta versión no permite sincronización en tiempo real entre computadoras independientes. La integración de una base de datos centralizada se contempla como una mejora futura.

## 8. Pruebas y validaciones

Durante el desarrollo se realizaron comprobaciones relacionadas con:

- Inicio y cierre de sesión.
- Acceso según roles.
- Registro y modificación de empleados.
- Validaciones de formularios.
- Cambios de estados AUX.
- Persistencia de registros.
- Actualización de indicadores y gráficas.
- Filtros de reportes.
- Exportaciones CSV, Excel y PDF.

La validación final automatizada reportó 31 casos de prueba aprobados, sin fallos registrados. Estos resultados corresponden a las pruebas realizadas sobre el prototipo y no constituyen una certificación de seguridad de producción.

## 9. Entregables — Etapa 3, Foro 1

### Código fuente

Repositorio GitHub:

https://github.com/Androx2000/TimeShift

### Video demostrativo

[Ver video de demostración](PEGAR_AQUI_ENLACE_DEL_VIDEO)

El video presenta las principales funcionalidades desarrolladas, incluyendo Dashboard, Gestión de Empleados, Portal AUX y Reportes.

### Documento de investigación

[Descargar investigación de librerías JavaScript — PDF](docs/TimeShift Foro1.pdf)

El documento desarrolla el análisis de las librerías utilizadas en el proyecto, sus características, justificación técnica, aplicaciones prácticas y referencias bibliográficas en formato APA 7.ª edición.

## 10. Trabajo colaborativo

El proyecto se desarrolló utilizando Git y GitHub como herramientas de control de versiones.

Se utilizaron ramas para organizar las funcionalidades:

- `feature/dashboard`
- `feature/portal-aux`
- `feature/gestion-usuarios`
- `feature/reportes`

Posteriormente, los módulos fueron integrados y sometidos a pruebas en ramas de integración y control de calidad antes de incorporarse a `main`.

El historial de commits y Pull Requests del repositorio permite consultar la evolución del proyecto.

## 11. Limitaciones y mejoras futuras

Entre las principales mejoras previstas se encuentran:

1. Migración hacia React y componentes reutilizables.
2. Integración de una API externa según los requisitos de las siguientes etapas.
3. Implementación de una base de datos centralizada.
4. Autenticación segura y autorización del lado del servidor.
5. Sincronización real entre dispositivos.
6. Mejoras de rendimiento y accesibilidad.
7. Despliegue en una plataforma de hosting.

## 12. Conclusiones

TimeShift incorpora herramientas interactivas que permiten automatizar tareas administrativas relacionadas con la asistencia y los estados laborales.

Chart.js facilita la interpretación de información mediante visualizaciones; SweetAlert2 mejora la retroalimentación de las acciones del usuario; y SheetJS y jsPDF permiten exportar información en formatos útiles para la administración.

El sistema constituye un avance funcional hacia una solución más completa de control de asistencia, manteniendo una arquitectura que podrá evolucionar en las siguientes etapas académicas.

---

**Proyecto académico — Universidad Don Bosco — Ciclo II 2026**
