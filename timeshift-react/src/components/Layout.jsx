import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getSession, logout } from '../services/auth';

const MENU = {
  admin: [
    { to: '/dashboard', texto: 'Dashboard' },
    { to: '/gestion', texto: 'Gestión de empleados' },
    { to: '/reportes', texto: 'Reportes' },
  ],
  empleado: [
    { to: '/portal', texto: 'Mi portal' },
  ],
};

export default function Layout() {
  const session = getSession();
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
            {/* Phone/tablet: logo and "Cerrar sesión" on top, menu below at full width
          (it scrolls sideways if it doesn't fit). From lg up, everything in one row. */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-primary px-4 py-3 text-white shadow sm:px-6 lg:gap-x-8">
        <strong className="text-lg tracking-tight">TimeShift</strong>
        <nav className="order-last flex w-full gap-1 overflow-x-auto lg:order-none lg:w-auto lg:flex-1">
          {MENU[session.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.texto}
            </NavLink>
          ))}
        </nav>
        <span className="ml-auto hidden text-sm text-white/80 sm:inline">{session.name} · {session.cargo}</span>
        <button
          type="button"
          onClick={cerrarSesion}
          className="ml-auto min-h-11 rounded-lg border border-white/40 px-3 text-sm font-medium hover:bg-white/10 sm:ml-0"
        >
          Cerrar sesión
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
