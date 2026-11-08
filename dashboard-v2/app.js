
function isAdmin() {
  if (typeof TimeShiftAuth === "undefined") {
    // Si no está disponible el objeto auth, verificar directamente en localStorage
    try {
      const s = JSON.parse(localStorage.getItem("timeshift_session"));
      if (s && s.rol === "admin") return true;
    } catch (_) {}
    const role = sessionStorage.getItem("ts_role") || localStorage.getItem("ts_role");
    return role === "admin";
  }

  const session = TimeShiftAuth.getSession();
  return session !== null && (session.rol === "admin" || session.role === "admin");
}

if (!isAdmin()) {
  window.location.replace("../index.html");
}

function getEmployees() {
  try {
    const saved = localStorage.getItem("ts_employees");

    if (!saved) {
      return [];
    }

    const employees = JSON.parse(saved);
    return Array.isArray(employees) ? employees : [];
  } catch (error) {
    console.error("Error al cargar empleados:", error);
    return [];
  }
}

function countEmployeesByState(employees, stateId) {
  return employees.filter(
    employee => employee.colorId === stateId
  ).length;
}

function filterEmployees(employees) {
  const searchInput = document.getElementById("employee-search");
  const stateFilter = document.getElementById("state-filter");

  const search = searchInput ? searchInput.value.trim().toLocaleLowerCase() : "";
  const selectedState = stateFilter ? stateFilter.value : "all";

  return employees.filter(employee => {
    const name = String(employee.name ?? "").toLocaleLowerCase();
    const matchesName = name.includes(search);

    const matchesState =
      selectedState === "all" ||
      employee.colorId === selectedState;

    return matchesName && matchesState;
  });
}

function renderEmployeesTable(employees) {
  const tbody = document.getElementById("employees-table-body");
  if (!tbody) return;

  tbody.replaceChildren();

  if (employees.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 3;
    cell.textContent = "No hay empleados registrados. Regístrelos en Gestión de Empleados.";
    cell.style.textAlign = "center";
    cell.style.color = "#64748b";
    cell.style.padding = "24px";
    return;
  }

  const stateLabels = {
    available: "Disponible",
    lunch: "Lunch",
    break: "Break",
    end: "Salida"
  };

  const stateColors = {
    available: "#16A34A",
    lunch: "#64748B",
    break: "#8B5CF6",
    end: "#EF4444"
  };

  employees.forEach(employee => {
    const row = tbody.insertRow();

    const nameCell = row.insertCell();
    const stateCell = row.insertCell();
    const timeCell = row.insertCell();

    const empName = employee.name ?? "Sin nombre";
    const empRole = employee.role ?? employee.cargo ?? "Personal Operativo";
    const avatarUrl = (typeof TimeShiftAPI !== "undefined")
      ? TimeShiftAPI.getAvatarUrl(empName, "e2e8f0")
      : `https://api.dicebear.com/10.x/pixelbot/svg?seed=${encodeURIComponent(empName)}&backgroundColor=e2e8f0`;

    nameCell.innerHTML = `
      <div class="emp-cell-flex">
        <img src="${avatarUrl}" alt="${empName}" class="emp-avatar-img"
             onerror="if(typeof TimeShiftAPI!=='undefined') TimeShiftAPI.handleAvatarError(this, '${empName.replace(/'/g, "\\'")}');">
        <div class="emp-info-wrap">
          <span class="emp-name-text">${empName}</span>
          <span class="emp-role-text">${empRole}</span>
        </div>
      </div>
    `;

    const stateId = employee.colorId || "available";
    const badgeColor = stateColors[stateId] || "#64748b";
    const label = stateLabels[stateId] || employee.state || "Desconocido";

    stateCell.innerHTML = `
      <span style="display:inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: ${badgeColor}; border: 1px solid ${badgeColor}; background: transparent;">
        ${label}
      </span>
    `;

    timeCell.textContent = employee.time ?? "00:00:00";
    timeCell.style.fontFamily = "monospace";
    timeCell.style.fontWeight = "bold";
  });
}

function updateDashboard() {
  const employees = getEmployees();

  const states = {
    available: "available-count",
    lunch: "lunch-count",
    break: "break-count",
    end: "end-count"
  };

  for (const [stateId, elementId] of Object.entries(states)) {
    const count = countEmployeesByState(employees, stateId);
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = count;
    }
  }

  const filteredEmployees = filterEmployees(employees);
  renderEmployeesTable(filteredEmployees);
  renderAuxChart(employees);
}

let auxChart = null;

function renderAuxChart(employees) {
  const canvas = document.getElementById("auxChart");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const labels = ["Disponible", "Lunch", "Break", "Salida"];
  const stateIds = ["available", "lunch", "break", "end"];
  const counts = stateIds.map(stateId =>
    countEmployeesByState(employees, stateId)
  );

  if (auxChart) {
    auxChart.data.datasets[0].data = counts;
    auxChart.update();
    return;
  }

  auxChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Cantidad de empleados",
        data: counts,
        backgroundColor: [
          "#16A34A",
          "#64748B",
          "#8B5CF6",
          "#EF4444"
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

let lastEmployeesData = null;

function checkForUpdates() {
  const currentData = localStorage.getItem("ts_employees");
  if (currentData !== lastEmployeesData) {
    lastEmployeesData = currentData;
    updateDashboard();
  }
}

/* ==========================================================================
   Consumo e Integración de APIs Externas (DAW901)
   ========================================================================== */
async function loadExternalAPIs() {
  const btn = document.getElementById("btn-refresh-api");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Cargando APIs...";
  }

  const timeEl = document.getElementById("api-official-time");
  const timeStatusEl = document.getElementById("api-time-status");
  const weatherEl = document.getElementById("api-weather-value");
  const weatherStatusEl = document.getElementById("api-weather-status");
  const weatherIconEl = document.getElementById("api-weather-icon");
  const holidayEl = document.getElementById("api-holiday-value");
  const holidayStatusEl = document.getElementById("api-holiday-status");

  if (typeof TimeShiftAPI === "undefined") {
    console.warn("TimeShiftAPI no disponible aún");
    if (btn) { btn.disabled = false; btn.textContent = "↻ Actualizar APIs"; }
    return;
  }

  // 1. Petición a API de Hora Oficial (El Salvador GMT-6)
  try {
    const timeData = await TimeShiftAPI.fetchOfficialTime();
    if (timeEl) timeEl.textContent = timeData.timeString;
    if (timeStatusEl) {
      timeStatusEl.textContent = `${timeData.source} (GMT-6)`;
      timeStatusEl.style.color = timeData.isSynced ? "#059669" : "#d97706";
    }
  } catch (err) {
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString("es-SV");
    if (timeStatusEl) {
      timeStatusEl.textContent = "Reloj Local (Offline)";
      timeStatusEl.style.color = "#dc2626";
    }
  }

  // 2. Petición a API de Clima (Open-Meteo)
  try {
    const weatherData = await TimeShiftAPI.fetchWeather();
    if (weatherEl) weatherEl.textContent = `${weatherData.temp}°C — ${weatherData.condition}`;
    if (weatherIconEl) weatherIconEl.textContent = weatherData.icon;
    if (weatherStatusEl) {
      weatherStatusEl.textContent = `Humedad: ${weatherData.humidity}% · ${weatherData.source}`;
      weatherStatusEl.style.color = weatherData.ok ? "#059669" : "#64748b";
    }
  } catch (err) {
    if (weatherEl) weatherEl.textContent = "26°C — Soleado";
    if (weatherStatusEl) weatherStatusEl.textContent = "Estimación local";
  }

  // 3. Petición a API de Asuetos Oficiales (Nager.Date)
  try {
    const holidayData = await TimeShiftAPI.fetchNextHoliday();
    if (holidayEl) {
      if (holidayData.ok) {
        const daysText = holidayData.daysLeft !== null ? ` (en ${holidayData.daysLeft} días)` : "";
        holidayEl.textContent = `${holidayData.name}${daysText}`;
      } else {
        holidayEl.textContent = holidayData.name;
      }
    }
    if (holidayStatusEl) {
      holidayStatusEl.textContent = holidayData.ok ? `Fecha: ${holidayData.date} · API SV` : "Calendario nacional";
      holidayStatusEl.style.color = holidayData.ok ? "#059669" : "#64748b";
    }
  } catch (err) {
    if (holidayEl) holidayEl.textContent = "Fin de año / Asueto";
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = "↻ Actualizar APIs";
  }
}

// Iniciar actualizaciones y consumo de APIs
document.addEventListener("DOMContentLoaded", () => {
  checkForUpdates();
  setInterval(checkForUpdates, 1000);

  const searchInput = document.getElementById("employee-search");
  if (searchInput) searchInput.addEventListener("input", updateDashboard);

  const stateFilter = document.getElementById("state-filter");
  if (stateFilter) stateFilter.addEventListener("change", updateDashboard);

  const refreshBtn = document.getElementById("btn-refresh-api");
  if (refreshBtn) refreshBtn.addEventListener("click", loadExternalAPIs);

  // Cargar APIs externas inicialmente
  loadExternalAPIs();

  // Actualizar hora oficial cada 30 segundos
  setInterval(async () => {
    if (typeof TimeShiftAPI !== "undefined") {
      const timeData = await TimeShiftAPI.fetchOfficialTime();
      const timeEl = document.getElementById("api-official-time");
      if (timeEl) timeEl.textContent = timeData.timeString;
    }
  }, 30000);
});

// En caso de que DOMContentLoaded ya haya disparado antes de que app.js ejecute
if (document.readyState === "complete" || document.readyState === "interactive") {
  checkForUpdates();
  loadExternalAPIs();
}
