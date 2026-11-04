import { Navigate } from 'react-router-dom';
import { getSession, routeForRole } from '../services/auth';

export default function RutaProtegida({ role, children }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (session.role !== role) {
    // Un empleado que escribe /dashboard termina en su portal, y al revés.
    return <Navigate to={routeForRole(session.role)} replace />;
  }
  return children;
}