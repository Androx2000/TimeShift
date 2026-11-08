/**
 * TimeShift — Módulo de Consumo de APIs Externas (React / ES Module)
 * Asignatura: DAW901 — Universidad Don Bosco
 *
 * Centraliza las peticiones asíncronas (fetch + async/await) para componentes React.
 */

const ENDPOINTS = {
  timePrimary: 'https://timeapi.io/api/v1/time/current/zone?timeZone=America/El_Salvador',
  timeFallback: 'https://worldtimeapi.org/api/timezone/America/El_Salvador',
  weatherSanSalvador: 'https://api.open-meteo.com/v1/forecast?latitude=13.6929&longitude=-89.2182&current=temperature_2m,relative_humidity_2m,weather_code&timezone=America%2FEl_Salvador',
  holidaysSV: 'https://date.nager.at/api/v3/NextPublicHolidays/SV',
  randomUser: 'https://randomuser.me/api/?nat=es&inc=name,email,phone,picture,gender',
  diceBearBase: 'https://api.dicebear.com/10.x/pixelbot/svg',
};

export function createFallbackAvatarDataUri(name, bg = '#1e3a8a') {
  const clean = String(name || 'TS').trim();
  const initials = clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'TS';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="50" fill="${bg}"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            font-size="38" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
        ${initials}
      </text>
    </svg>
  `.trim();

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function getAvatarUrl(name, bg = 'e2e8f0') {
  const seed = encodeURIComponent(String(name || 'TimeShift').trim());
  return `${ENDPOINTS.diceBearBase}?seed=${seed}&backgroundColor=${bg}`;
}

export async function fetchOfficialTime() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(ENDPOINTS.timePrimary, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    const hourPad = String(data.hour).padStart(2, '0');
    const minPad = String(data.minute).padStart(2, '0');
    const secPad = String(data.seconds).padStart(2, '0');
    const timeStr = `${hourPad}:${minPad}:${secPad}`;

    return {
      ok: true,
      source: 'TimeAPI.io',
      timeString: timeStr,
      dateString: data.date || `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`,
      iso: data.dateTime || new Date().toISOString(),
      timeZone: data.timeZone || 'America/El_Salvador',
      isSynced: true,
    };
  } catch (errPrimary) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp2 = await fetch(ENDPOINTS.timeFallback, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!resp2.ok) throw new Error(`HTTP ${resp2.status}`);
      const data2 = await resp2.json();
      const remoteDate = new Date(data2.datetime);

      return {
        ok: true,
        source: 'WorldTimeAPI.org',
        timeString: remoteDate.toLocaleTimeString('es-SV', { hour12: false }),
        dateString: remoteDate.toLocaleDateString('es-SV'),
        iso: data2.datetime,
        timeZone: data2.timezone || 'America/El_Salvador',
        isSynced: true,
      };
    } catch (errSecondary) {
      const now = new Date();
      return {
        ok: false,
        source: 'Reloj Local (Offline)',
        timeString: now.toLocaleTimeString('es-SV', { hour12: false }),
        dateString: now.toLocaleDateString('es-SV'),
        iso: now.toISOString(),
        timeZone: 'Local',
        isSynced: false,
        error: `${errPrimary.message}; ${errSecondary.message}`,
      };
    }
  }
}

export async function fetchWeather() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const resp = await fetch(ENDPOINTS.weatherSanSalvador, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const current = data.current || {};

    const code = current.weather_code ?? 0;
    let condition = 'Despejado';
    let icon = '☀️';

    if (code === 0) { condition = 'Cielo despejado'; icon = '☀️'; }
    else if (code <= 3) { condition = 'Parcialmente nublado'; icon = '⛅'; }
    else if (code <= 48) { condition = 'Neblina'; icon = '🌫️'; }
    else if (code <= 67) { condition = 'Lluvia ligera/moderada'; icon = '🌧️'; }
    else if (code <= 82) { condition = 'Chubascos'; icon = '🌦️'; }
    else { condition = 'Tormenta eléctrica'; icon = '⛈️'; }

    return {
      ok: true,
      temp: Math.round(current.temperature_2m ?? 26),
      humidity: current.relative_humidity_2m ?? 60,
      condition,
      icon,
      location: 'San Salvador, SV',
      source: 'Open-Meteo',
    };
  } catch (e) {
    return {
      ok: false,
      temp: 26,
      humidity: 65,
      condition: 'Clima habitual',
      icon: '⛅',
      location: 'San Salvador, SV',
      source: 'Estimación local',
      error: e.message,
    };
  }
}

export async function fetchNextHoliday() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(ENDPOINTS.holidaysSV, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const holidays = await resp.json();

    if (Array.isArray(holidays) && holidays.length > 0) {
      const next = holidays[0];
      const holDate = new Date(next.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((holDate - today) / (1000 * 60 * 60 * 24));

      return {
        ok: true,
        name: next.localName || next.name,
        date: next.date,
        daysLeft: diffDays,
        source: 'Nager.Date API',
      };
    }
    throw new Error('Sin feriados próximos registrados');
  } catch (e) {
    return {
      ok: false,
      name: 'Próximo asueto nacional',
      date: 'Calendario laboral',
      daysLeft: null,
      error: e.message,
    };
  }
}

export async function fetchRandomEmployee() {
  const rolesDisponibles = [
    'Abogada Litigante',
    'Abogado Corporativo',
    'Asistente Legal',
    'Recepción',
    'Contabilidad',
    'Mensajería / Notificador',
  ];
  const deptsDisponibles = [
    'Asesoría Legal',
    'Estrategia',
    'Administración',
    'Operaciones',
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(ENDPOINTS.randomUser, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const u = json.results && json.results[0];

    if (!u) throw new Error('Estructura de respuesta inválida');

    const firstName = u.name.first || 'Colaborador';
    const lastName = u.name.last || 'Invitado';
    const fullName = `${firstName} ${lastName}`;
    const cleanUsername = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase().replace(/[^a-z]/g, '')}`;
    const email = `${cleanUsername}@jovitaalvarado.com`;
    const phone = u.phone || '7000-0000';

    const role = rolesDisponibles[Math.floor(Math.random() * rolesDisponibles.length)];
    const department = deptsDisponibles[Math.floor(Math.random() * deptsDisponibles.length)];
    const avatarUrl = u.picture?.medium || getAvatarUrl(fullName);

    return {
      ok: true,
      employee: {
        name: fullName,
        email: email,
        phone: phone,
        role: role,
        department: department,
        shift: '08:00 - 17:00',
        state: 'Disponible',
        colorId: 'available',
        time: '00:00:00',
        avatarUrl: avatarUrl,
      },
      source: 'RandomUser API',
    };
  } catch (e) {
    const fallbackNames = ['Rodrigo Martínez', 'Elena Vásquez', 'Mauricio Rivas', 'Gabriela Solís'];
    const pick = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
    const clean = pick.toLowerCase().replace(/\s+/g, '.');

    return {
      ok: false,
      employee: {
        name: pick,
        email: `${clean}@jovitaalvarado.com`,
        phone: '7123-4567',
        role: rolesDisponibles[0],
        department: deptsDisponibles[0],
        shift: '08:00 - 17:00',
        state: 'Disponible',
        colorId: 'available',
        time: '00:00:00',
        avatarUrl: getAvatarUrl(pick),
      },
      error: e.message,
    };
  }
}
