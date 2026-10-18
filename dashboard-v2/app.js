
const employees = [
  { id: 1, name: "Ana", state: "available" },
  { id: 2, name: "Carlos", state: "lunch" },
  { id: 3, name: "María", state: "break" },
  { id: 4, name: "José", state: "available" },
  { id: 5, name: "Luis", state: "end" }
];

function countEmployeesByState(state) {
  return employees.filter(
    employee => employee.state === state
  ).length;
}

function updateDashboard() {
  const states = {
    available: "available-count",
    lunch: "lunch-count",
    break: "break-count",
    end: "end-count"
  };

  for (const [state, elementId] of Object.entries(states)) {
    const count = countEmployeesByState(state);
    const element = document.getElementById(elementId);

    if (element) {
      element.textContent = count;
    }
  }
}

updateDashboard();
