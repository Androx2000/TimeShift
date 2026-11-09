/**
 * TimeShift — Módulo de Consumo de APIs Externas (React / ES Module)
 * Asignatura: DAW901 — Universidad Don Bosco
 *
 * Centraliza las peticiones asíncronas (fetch + async/await) para componentes React.
 */

const ENDPOINTS = {
  timePrimary: 'https://timeapi.io/api/time/current/zone?timeZone=America/El_Salvador',
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
        let icon = 'sun';

    if (code === 0) { condition = 'Cielo despejado'; icon = 'sun'; }
    else if (code <= 3) { condition = 'Parcialmente nublado'; icon = 'cloud'; }
    else if (code <= 48) { condition = 'Neblina'; icon = 'fog'; }
    else if (code <= 67) { condition = 'Lluvia ligera/moderada'; icon = 'rain'; }
    else if (code <= 82) { condition = 'Chubascos'; icon = 'showers'; }
    else { condition = 'Tormenta eléctrica'; icon = 'storm'; }

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
      icon: 'cloud',
      location: 'San Salvador, SV',
      source: 'Estimación local',
      error: e.message,
    };
  }
}

// Asuetos remunerados oficiales de El Salvador (Art. 190 del Código de Trabajo)
// Se excluyen días festivos generales o culturales sin asueto laboral (ej. Festival de la Pupusa,
// Día de la Cruz, Día del Soldado, Día del Niño, Día de la Raza, etc.).
const OFFICIAL_SV_ASUETOS_FIXED = {
  '01-01': 'Año Nuevo',
  '05-01': 'Día del Trabajo',
  '05-10': 'Día de la Madre',
  '06-17': 'Día del Padre',
  '08-03': 'Fiestas Agostinas (San Salvador)',
  '08-05': 'Fiestas Agostinas (San Salvador)',
  '08-06': 'Día del Divino Salvador del Mundo',
  '09-15': 'Día de la Independencia',
  '11-02': 'Día de los Difuntos',
  '12-25': 'Navidad',
};

function getHolyWeekAsuetos(year) {
  // Algoritmo de Meeus/Jones/Butcher para Domingo de Pascua
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easter = new Date(year, month - 1, day);
  const formatISO = (dt) => {
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const da = String(dt.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  };

  const juevesSanto = new Date(easter);
  juevesSanto.setDate(easter.getDate() - 3);
  const viernesSanto = new Date(easter);
  viernesSanto.setDate(easter.getDate() - 2);
  const sabadoGloria = new Date(easter);
  sabadoGloria.setDate(easter.getDate() - 1);

  return {
    [formatISO(juevesSanto)]: 'Jueves Santo',
    [formatISO(viernesSanto)]: 'Viernes Santo',
    [formatISO(sabadoGloria)]: 'Sábado de Gloria',
  };
}

function getOfficialAsuetosMap(years) {
  const map = {};
  for (const year of years) {
    for (const [mmdd, name] of Object.entries(OFFICIAL_SV_ASUETOS_FIXED)) {
      map[`${year}-${mmdd}`] = name;
    }
    Object.assign(map, getHolyWeekAsuetos(year));
  }
  return map;
}

function findNextOfficialAsueto(apiHolidays = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const officialMap = getOfficialAsuetosMap([currentYear, currentYear + 1]);

  // 1. Filtra los feriados devueltos por la API para conservar únicamente asuetos oficiales de ley
  const validFromApi = (Array.isArray(apiHolidays) ? apiHolidays : [])
    .filter((h) => h && h.date && officialMap[h.date])
    .map((h) => ({
      date: h.date,
      name: officialMap[h.date],
    }));

  // 2. Combina con el calendario oficial Art. 190 (por si la API omite ej. 1 de enero o 17 de junio)
  const mergedByDate = new Map();
  for (const [date, name] of Object.entries(officialMap)) {
    mergedByDate.set(date, { date, name });
  }
  for (const item of validFromApi) {
    mergedByDate.set(item.date, item);
  }

  const upcoming = Array.from(mergedByDate.values())
    .map((item) => {
      const holDate = new Date(item.date + 'T00:00:00');
      const diffDays = Math.ceil((holDate - today) / (1000 * 60 * 60 * 24));
      return { ...item, diffDays };
    })
    .filter((item) => item.diffDays >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  return upcoming[0] || null;
}

export async function fetchNextHoliday() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(ENDPOINTS.holidaysSV, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const holidays = await resp.json();

    const nextOfficial = findNextOfficialAsueto(holidays);
    if (nextOfficial) {
      return {
        ok: true,
        name: nextOfficial.name,
        date: nextOfficial.date,
        daysLeft: nextOfficial.diffDays,
        source: 'Nager.Date API (Asuetos SV)',
      };
    }
    throw new Error('Sin asuetos oficiales próximos registrados');
  } catch (e) {
    const fallbackNext = findNextOfficialAsueto([]);
    return {
      ok: false,
      name: fallbackNext ? fallbackNext.name : 'Próximo asueto nacional',
      date: fallbackNext ? fallbackNext.date : 'Calendario laboral',
      daysLeft: fallbackNext ? fallbackNext.diffDays : null,
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
