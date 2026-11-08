import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyCredentials, createSession, logout, routeForRole } from '../services/auth';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    logout();
  }, []);

  function manejarEnvio(evento) {
    evento.preventDefault();

    const cuenta = verifyCredentials(usuario, clave);
    if (!cuenta) {
      setError('Credenciales inválidas. Por favor verifique e intente de nuevo.');
      return;
    }

    // El rol lo decide la cuenta, no el usuario.
    createSession(cuenta);
    navigate(routeForRole(cuenta.role));
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-primary">TimeShift</h1>
        <p className="mb-6 text-center text-sm text-text-muted">Portal de Gestión y Asistencia</p>

        <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Usuario
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Contraseña
            <div className="flex gap-2">
              <input
                type={verClave ? 'text' : 'password'}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setVerClave(!verClave)}
                aria-label="Mostrar u ocultar contraseña"
                className="rounded-lg border border-slate-300 px-3 text-sm font-normal text-text-muted hover:bg-slate-50"
              >
                {verClave ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-hover"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </section>
  );
}
