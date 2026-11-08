// src/context/EmpleadosProvider.jsx
// Estado global de empleados: un reducer que guarda TODOS los usuarios
// (admins incluidos, para no perderlos) y los persiste en localStorage.
import { useEffect, useMemo, useReducer } from 'react';
import { EmpleadosContext } from './EmpleadosContext';
import { clearSavedStatus, loadUsers, saveUsers } from '../services/empleados';

function reducer(users, action) {
  switch (action.type) {
    case 'add':
      return [...users, action.user];
    case 'update':
      return users.map((user) =>
        user.username === action.username ? { ...user, ...action.changes } : user
      );
    case 'remove':
      return users.filter((user) => user.username !== action.username);
    default:
      return users;
  }
}

export default function EmpleadosProvider({ children }) {
  const [users, dispatch] = useReducer(reducer, undefined, loadUsers);

  // Cada cambio de estado se guarda; el login lee la misma clave.
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  const value = useMemo(
    () => ({
      users,
      empleados: users.filter((user) => user.role === 'empleado'),

      addEmpleado(data) {
        dispatch({
          type: 'add',
          user: {
            username: data.username.trim().toLowerCase(),
            password: data.password,
            role: 'empleado',
            cargo: data.cargo.trim(),
            name: data.name.trim(),
          },
        });
      },

      updateEmpleado(username, data) {
        const changes = { name: data.name.trim(), cargo: data.cargo.trim() };
        if (data.password) {
          changes.password = data.password;
        }
        dispatch({ type: 'update', username, changes });
      },

      removeEmpleado(username) {
        clearSavedStatus(username);
        dispatch({ type: 'remove', username });
      },
    }),
    [users]
  );

  return <EmpleadosContext.Provider value={value}>{children}</EmpleadosContext.Provider>;
}
