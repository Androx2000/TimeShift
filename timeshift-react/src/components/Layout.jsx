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
      <header className="flex flex-wrap items-center gap-x-8 gap-y-2 bg-primary px-6 py-3 text-white shadow">
        <strong className="text-lg tracking-tight">TimeShift</strong>
        <nav className="flex flex-1 gap-1">
          {MENU[session.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.texto}
            </NavLink>
          ))}
        </nav>
        <span className="text-sm text-white/80">{session.name} · {session.cargo}</span>
        <button
          type="button"
          onClick={cerrarSesion}
          className="rounded-lg border border-white/40 px-3 py-1.5 text-sm font-medium hover:bg-white/10"
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