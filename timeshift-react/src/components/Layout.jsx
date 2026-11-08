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
    <div>
      <header>
        <strong>TimeShift</strong>
        <nav>
          {MENU[session.role].map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.texto}
            </NavLink>
          ))}
        </nav>
        <span>{session.name} · {session.cargo}</span>
        <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}