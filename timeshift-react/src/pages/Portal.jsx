import { useState, useEffect } from 'react';
import { getSession } from '../services/auth';
import { fetchOfficialTime, fetchWeather, getAvatarUrl, createFallbackAvatarDataUri } from '../services/externalApi';

export default function Portal() {
  const session = getSession() || { name: 'Andrea Ruiz', role: 'empleado', cargo: 'Abogada Litigante', username: 'aruiz' };
  const [currentState, setCurrentState] = useState('Disponible');
  const [seconds, setSeconds] = useState(0);
  const [weather, setWeather] = useState(null);
  const [officialTime, setOfficialTime] = useState(null);

  const states = [
    { id: 'available', label: 'Disponible', color: '#16A34A', desc: 'En jornada laboral activa' },
    { id: 'lunch', label: 'Lunch', color: '#64748B', desc: 'Tiempo destinado al almuerzo' },
    { id: 'break', label: 'Break', color: '#8B5CF6', desc: 'Pausa breve de descanso' },
    { id: 'end', label: 'Salida', color: '#EF4444', desc: 'Finalización de la jornada' },
  ];

  // Temporizador de duración en estado actual
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentState]);

  // Consumo de APIs externas en el portal (Hora Oficial y Clima para Diligencias)
  useEffect(() => {
    async function loadApis() {
      try {
        const [w, t] = await Promise.all([fetchWeather(), fetchOfficialTime()]);
        setWeather(w);
        setOfficialTime(t);
      } catch (e) {
        console.error('Error cargando APIs en Portal:', e);
      }
    }
    loadApis();
  }, []);

  function handleStateChange(label) {
    if (label === currentState) return;
    if (label === 'Salida' && !window.confirm('¿Confirmar registro de Salida? Se finalizará el registro de turno.')) {
      return;
    }
    setCurrentState(label);
    setSeconds(0);
  }

  const formatTimer = (sec) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const activeColor = states.find((s) => s.label === currentState)?.color || '#16A34A';

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header del Portal */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={getAvatarUrl(session.name)}
            alt={session.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = createFallbackAvatarDataUri(session.name);
            }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#e2e8f0',
              objectFit: 'cover'
            }}
          />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              {session.name}
            </h1>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {session.cargo || 'Empleado'} · Oficina Jurídica Jovita Alvarado
            </span>
          </div>
        </div>

        {/* Widgets de APIs externas en cabecera */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Hora Oficial */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <span style={{ color: '#059669', fontWeight: 'bold' }}>● </span>
            Hora Oficial: <strong>{officialTime?.timeString || 'Sincronizando...'}</strong>
          </div>

          {/* Clima Open-Meteo */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#92400e'
          }}>
            <span>{weather?.icon || '⛅'} </span>
            {weather ? `${weather.temp}°C (San Salvador)` : 'Cargando clima...'}
          </div>
        </div>
      </div>

      {/* Reloj de Estado Actual */}
      <div style={{
        background: '#ffffff',
        padding: '36px 24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        marginBottom: '28px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: activeColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          TIEMPO EN ESTADO ACTUAL ({currentState.toUpperCase()})
        </div>
        <div style={{
          fontSize: '64px',
          fontWeight: 900,
          color: '#0f172a',
          fontFamily: 'monospace',
          margin: '12px 0'
        }}>
          {formatTimer(seconds)}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Haga clic en los botones de abajo para alternar su estado AUX
        </div>
      </div>

      {/* Selector de Estados AUX */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {states.map((st) => {
          const isActive = st.label === currentState;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => handleStateChange(st.label)}
              style={{
                background: isActive ? st.color : '#ffffff',
                color: isActive ? '#ffffff' : '#0f172a',
                border: `2px solid ${st.color}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? `0 4px 12px ${st.color}50` : '0 1px 3px rgba(0,0,0,0.05)',
                transform: isActive ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{st.label}</div>
              <div style={{ fontSize: '12px', opacity: isActive ? 0.9 : 0.6, marginTop: '4px' }}>
                {st.desc}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
