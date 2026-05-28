import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { GlobalDataProvider } from './providers/GlobalDataProvider';
import { ToastProvider } from './providers/ToastProvider';
import { MicrosoftAuthProvider } from './providers/MicrosoftAuthProvider';
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
const MapaClasse = React.lazy(() => import('../features/turmas/MapaClasse'));
const Relatorios = React.lazy(() => import('../features/relatorios/Relatorios/Relatorios'));
const BoasPraticas = React.lazy(() => import('../features/boaspraticas/BoasPraticas'));

function AppRoutes() {
  const { session, authLoading, isMaster } = useAuth();
  
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
            <Route path="configuracoes" element={isMaster ? <Configuracoes /> : <Navigate to="/" replace />} />
            <Route path="turmas" element={<Turmas />} />
            <Route path="mapa-classe" element={<MapaClasse />} />
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
  const isMsalPopup = typeof window !== 'undefined' && window.opener && window.opener !== window && window.name && (window.name.includes("msal.") || window.name.includes("msal-"));

  if (isMsalPopup) {
    return (
      <MicrosoftAuthProvider>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', 
          fontFamily: 'sans-serif', 
          color: '#4B5563', 
          backgroundColor: '#F9FAFB',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #E5E7EB',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Conectando com a Microsoft...</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Esta janela fechará automaticamente.</p>
          </div>
        </div>
      </MicrosoftAuthProvider>
    );
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <MicrosoftAuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <InstallPWA />
          </BrowserRouter>
        </MicrosoftAuthProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
