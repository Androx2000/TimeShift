import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getSession, logout } from '../services/auth';
import { getAvatarUrl, createFallbackAvatarDataUri } from '../services/externalApi';

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
  const session = getSession() || { name: 'Usuario TimeShift', role: 'admin', cargo: 'Personal' };
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate('/login', { replace: true });
  }

  const role = session.role || 'admin';
  const menuItems = MENU[role] || MENU.admin;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#111827',
        color: '#ffffff',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <strong style={{ fontSize: '20px', color: '#ffffff', letterSpacing: '-0.02em' }}>TimeShift</strong>
          <nav style={{ display: 'flex', gap: '12px' }}>
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? '#1e293b' : 'transparent',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                })}
              >
                {item.texto}
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Avatar del usuario desde DiceBear API */}
          <img
            src={getAvatarUrl(session.name)}
            alt={session.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = createFallbackAvatarDataUri(session.name);
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#334155',
              objectFit: 'cover',
              border: '1px solid #475569'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              {session.name}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {session.cargo || session.role}
            </span>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            style={{
              background: '#374151',
              color: '#f9fafb',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '16px' }}>
        <Outlet />
      </main>
    </div>
  );
}
