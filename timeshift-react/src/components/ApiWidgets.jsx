import { useState, useEffect } from 'react';
import { fetchOfficialTime, fetchWeather, fetchNextHoliday } from '../services/externalApi';

export default function ApiWidgets() {
  const [timeData, setTimeData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [holidayData, setHolidayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pide las tres APIs en paralelo cada vez que cambia refreshKey.
  // Los setState ocurren después de await, y "cancelled" evita
  // actualizar el estado si el componente ya se desmontó.
  useEffect(() => {
    let cancelled = false;
    async function loadApis() {
      try {
        const [t, w, h] = await Promise.all([
          fetchOfficialTime(),
          fetchWeather(),
          fetchNextHoliday(),
        ]);
        if (cancelled) return;
        setTimeData(t);
        setWeatherData(w);
        setHolidayData(h);
      } catch (err) {
        console.error('Error cargando APIs externas en React:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadApis();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Botón "Actualizar APIs"
  function refresh() {
    setLoading(true);
    setRefreshKey((key) => key + 1);
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* 1. Hora Oficial */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⏱️</span>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
            Hora Oficial SV (API)
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', fontFamily: 'monospace' }}>
            {timeData ? timeData.timeString : 'Sincronizando...'}
          </div>
          <span style={{ fontSize: '10px', color: timeData?.isSynced ? '#059669' : '#d97706', fontWeight: 600 }}>
            {timeData?.source || 'Conectando'} (GMT-6)
          </span>
        </div>
      </div>

      {/* 2. Clima San Salvador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>{weatherData?.icon || '⛅'}</span>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
            Clima Diligencias (Open-Meteo)
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
            {weatherData ? `${weatherData.temp}°C — ${weatherData.condition}` : 'Cargando clima...'}
          </div>
          <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>
            San Salvador · Humedad: {weatherData?.humidity ?? '--'}%
          </span>
        </div>
      </div>

      {/* 3. Próximo Asueto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>📅</span>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
            Próximo Asueto (Nager.Date)
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
            {holidayData ? holidayData.name : 'Consultando...'}
          </div>
          <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>
            {holidayData?.daysLeft !== null && holidayData?.daysLeft !== undefined
              ? `Faltan ${holidayData.daysLeft} días (${holidayData.date})`
              : 'Calendario oficial'}
          </span>
        </div>
      </div>

      {/* Botón Refrescar */}
      <div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          style={{
            background: '#1e3a8a',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Consultando...' : '↻ Actualizar APIs'}
        </button>
      </div>
    </div>
  );
}
