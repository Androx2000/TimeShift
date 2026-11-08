// src/hooks/useEmpleados.js
import { useContext } from 'react';
import { EmpleadosContext } from '../context/EmpleadosContext';

/** Acceso al estado de empleados. Solo funciona dentro de <EmpleadosProvider>. */
export function useEmpleados() {
  const context = useContext(EmpleadosContext);
  if (!context) {
    throw new Error('useEmpleados debe usarse dentro de <EmpleadosProvider>.');
  }
  return context;
}
