import { findState } from '../constants/states';

// Colored dot + label of an AUX state. Same look in Portal and Monitor.
export default function StateBadge({ stateId }) {
  const state = findState(stateId);
  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      <span className={`w-2.5 h-2.5 rounded-full ${state.bg}`} aria-hidden="true" />
      <span className={state.text}>{state.label}</span>
    </span>
  );
}