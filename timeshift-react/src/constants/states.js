// The 4 AUX states of the system. Single source of truth:
// no screen should hardcode these colors on its own.

export const STATES = [
    { id: 'available', label: 'Disponible', bg: 'bg-available', text: 'text-available' },
    { id: 'lunch', label: 'Lunch', bg: 'bg-lunch', text: 'text-lunch' },
    { id: 'break', label: 'Break', bg: 'bg-break', text: 'text-break' },
    { id: 'end', label: 'Salida', bg: 'bg-end', text: 'text-end' },
];

/** Returns the state with the given id, or "Disponible" if it does not exist. */
export function findState(id) {
    return STATES.find((state) => state.id === id) ?? STATES[0];
}