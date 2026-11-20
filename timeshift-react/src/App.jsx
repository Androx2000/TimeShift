import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Portal from './pages/Portal.jsx';
import GestionDatos from './pages/GestionDatos';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import EmpleadosProvider from './context/EmpleadosProvider';


const Reportes = lazy(() => import('./pages/Reportes'));

export default function App() {
  return (
    <BrowserRouter>
         <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Páginas del administrador: misma barra, solo rol admin */}
        <Route element={<RutaProtegida role="admin"><EmpleadosProvider><Layout /></EmpleadosProvider></RutaProtegida>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gestion" element={<GestionDatos />} />
                    <Route
            path="/reportes"
            element={
              <Suspense fallback={<p className="p-8 text-sm text-text-muted">Cargando reportes…</p>}>
                <Reportes />
              </Suspense>
            }
          />
        </Route>

        {/* Página del empleado */}
        <Route element={<RutaProtegida role="empleado"><Layout /></RutaProtegida>}>
          <Route path="/portal" element={<Portal />} />
        </Route>

        <Route path="*" element={<h1>Página no encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
}