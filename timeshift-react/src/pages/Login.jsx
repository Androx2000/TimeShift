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
    <section>
      <h1>TimeShift</h1>
      <p>Portal de Gestión y Asistencia</p>

      <form onSubmit={manejarEnvio}>
        <label>
          Usuario
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        </label>

        <label>
          Contraseña
          <input type={verClave ? 'text' : 'password'} value={clave}
                 onChange={(e) => setClave(e.target.value)} required />
        </label>
        <button type="button" onClick={() => setVerClave(!verClave)}
                aria-label="Mostrar u ocultar contraseña">
          {verClave ? 'Ocultar' : 'Mostrar'}
        </button>

        {error && <p role="alert">{error}</p>}

        <button type="submit">Iniciar Sesión</button>
      </form>
    </section>
  );
}