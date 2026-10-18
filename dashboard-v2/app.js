
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


function renderEmployeesTable(employees) {
  const tbody = document.getElementById(
    "employees-table-body"
  );

  if (!tbody) return;

  tbody.replaceChildren();

  if (employees.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 3;
    cell.textContent = "No hay empleados registrados.";
    return;
  }

  const stateLabels = {
    available: "Disponible",
    lunch: "Lunch",
    break: "Break",
    end: "Salida"
  };

  employees.forEach(employee => {
    const row = tbody.insertRow();

    const nameCell = row.insertCell();
    const stateCell = row.insertCell();
    const timeCell = row.insertCell();

    nameCell.textContent = employee.name ?? "Sin nombre";

    stateCell.textContent =
      stateLabels[employee.colorId] ?? "Desconocido";

    timeCell.textContent = employee.time ?? "00:00:00";
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
    const count = countEmployeesByState(
      employees,
      stateId
      
    );  

    const element = document.getElementById(elementId);

    if (element) {
      element.textContent = count;
    }
  }

    renderEmployeesTable(employees);
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

// Primera actualización.
checkForUpdates();

// Consultar cambios una vez por segundo.
setInterval(checkForUpdates, 1000);
