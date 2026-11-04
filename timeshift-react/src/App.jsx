import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Portal from './pages/Portal';
import Reportes from './pages/Reportes';
import GestionDatos from './pages/GestionDatos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/gestion" element={<GestionDatos />} />
        <Route path="*" element={<h1>Página no encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
}