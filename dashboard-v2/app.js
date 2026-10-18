
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
}

updateDashboard();
