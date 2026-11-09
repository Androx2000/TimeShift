import { useState, useEffect } from 'react';
import { fetchWeather, fetchNextHoliday } from '../services/externalApi';
import {
  IconCalendarEvent,
  IconCloud,
  IconCloudFog,
  IconCloudRain,
  IconCloudStorm,
  IconSun,
  IconUmbrella,
} from '@tabler/icons-react';

const API_REFRESH_MS = 600000;

// Maps the weather key returned by the service to its Tabler icon.
const WEATHER_ICONS = {
  sun: IconSun,
  cloud: IconCloud,
  fog: IconCloudFog,
  rain: IconCloudRain,
  showers: IconUmbrella,
  storm: IconCloudStorm,
};

export default function ApiWidgets() {
  const [weatherData, setWeatherData] = useState(null);
  const [holidayData, setHolidayData] = useState(null);

    // Pide el clima y el feriado al montar y luego cada 10 minutos.
  // "cancelled" evita actualizar el estado si el componente ya se desmontó.
  useEffect(() => {
    let cancelled = false;
    async function loadApis() {
      try {
        const [w, h] = await Promise.all([
          fetchWeather(),
          fetchNextHoliday(),
        ]);
        if (cancelled) return;
        setWeatherData(w);
        setHolidayData(h);
      } catch (err) {
        console.error('Error cargando APIs externas en React:', err);
      }
    }
    loadApis();
    const intervalId = setInterval(loadApis, API_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

 
  const WeatherIcon = WEATHER_ICONS[weatherData?.icon] ?? IconCloud;

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
    }}
    >

      {/* 2. Clima San Salvador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <WeatherIcon size={24} stroke={1.75} className="text-primary" aria-hidden="true" />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
            Clima 
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
        <IconCalendarEvent size={24} stroke={1.75} className="text-primary" aria-hidden="true" />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
            Próximo Asueto
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
    </div>
  );
}
