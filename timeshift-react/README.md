# TimeShift (React)

Migración a React del sistema de control de asistencia y estados AUX de TimeShift.

## Cómo ejecutar

```bash
npm install
npm run dev
```

## Estructura

- `src/pages/`: pantallas (Login, Portal, Monitor/Dashboard, Gestión, Reportes)
- `src/components/`: componentes reutilizables (Card, StateBadge, Layout, RutaProtegida)
- `src/services/`: acceso a datos en localStorage (`auth.js`, `status.js`)
- `src/constants/states.js`: los 4 estados AUX y sus colores (única fuente)
- `src/utils/time.js`: formato de duraciones `HH:MM:SS`

## Usuarios de prueba

Están en `src/services/auth.js` (`DEFAULT_USERS`). Los `admin` entran al Monitor; los `empleado`, al Portal.

## Datos compartidos (localStorage)

- `timeshift_users`: usuarios
- `timeshift_session`: sesión activa
- `ts_status_<usuario>`: estado actual y hora de inicio
- `ts_history_<usuario>_<AAAA-MM-DD>`: historial del día