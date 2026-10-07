import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NovaCarga from './pages/NovaCarga';
import MinhasCargas from './pages/MinhasCargas';
import Fretes from './pages/Fretes';
import FreteDetalhe from './pages/FreteDetalhe';
import Impacto from './pages/Impacto';
import SmsLogs from './pages/SmsLogs';
import MatcherLogs from './pages/MatcherLogs';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="nova" element={<NovaCarga />} />
          <Route path="minhas-cargas" element={<MinhasCargas />} />
          <Route path="fretes" element={<Fretes />} />
          <Route path="fretes/:codigo" element={<FreteDetalhe />} />
          <Route path="impacto" element={<Impacto />} />
          <Route path="sms-logs" element={<SmsLogs />} />
          <Route path="matcher-logs" element={<MatcherLogs />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
