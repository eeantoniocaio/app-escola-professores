import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { GlobalDataProvider } from './providers/GlobalDataProvider';
import { ToastProvider } from './providers/ToastProvider';
import MainLayout from '../shared/ui/layouts/MainLayout';
import InstallPWA from '../shared/ui/InstallPWA';
import Login from '../features/auth/Login';

const Home = React.lazy(() => import('../features/dashboard/Home'));
const Eventos = React.lazy(() => import('../features/eventos/Eventos'));
const Registros = React.lazy(() => import('../features/registros/Registros'));
const HistoricoOcorrencias = React.lazy(() => import('../features/ocorrencias/HistoricoOcorrencias'));
const EnvioQuestoes = React.lazy(() => import('../features/reposicoes/EnvioQuestoes'));
const Configuracoes = React.lazy(() => import('../features/settings/Configuracoes'));
const Turmas = React.lazy(() => import('../features/turmas/Turmas'));
const Relatorios = React.lazy(() => import('../features/relatorios/Relatorios/Relatorios'));
const BoasPraticas = React.lazy(() => import('../features/boaspraticas/BoasPraticas'));

function AppRoutes() {
  const { session, authLoading } = useAuth();
  
  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Verificando autenticação...</div>;

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <GlobalDataProvider>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Carregando interface...</div>}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="eventos/novo" element={<Eventos />} />
            <Route path="eventos/editar/:id" element={<Eventos />} />
            <Route path="registros" element={<Registros />} />
            <Route path="ocorrencias" element={<HistoricoOcorrencias />} />
            <Route path="reposicoes" element={<EnvioQuestoes />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="turmas" element={<Turmas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="boas-praticas" element={<BoasPraticas />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </GlobalDataProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <InstallPWA />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
