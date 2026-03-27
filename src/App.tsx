import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TiendaForm from './pages/TiendaForm';
import AdminDashboard from './pages/AdminDashboard';
import MensajeroApp from './pages/MensajeroApp';
import MensajeroLogin from './pages/MensajeroLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/t/:url" element={<TiendaForm />} />
        <Route path="/admin/:tenantId" element={<AdminDashboard />} />
        <Route path="/m" element={<MensajeroLogin />} />
        <Route path="/m/:mensajeroId" element={<MensajeroApp />} />
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
