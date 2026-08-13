import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { GlobalDataProvider } from './providers/GlobalDataProvider';
import { ToastProvider } from './providers/ToastProvider';
import { GoogleAuthProvider } from './providers/GoogleAuthProvider';
import MainLayout from '../shared/ui/layouts/MainLayout';
import InstallPWA from '../shared/ui/InstallPWA';
import Login from '../features/auth/Login';
import ErrorBoundary from '../shared/ui/ErrorBoundary';

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
const Documentos = React.lazy(() => import('../features/documentos/Documentos'));
const Acervo = React.lazy(() => import('../features/acervo/Acervo'));
const Biblioteca = React.lazy(() => import('../features/biblioteca/Biblioteca'));
const Equipamentos = React.lazy(() => import('../features/equipamentos/Equipamentos'));
const SolicitacoesMateriais = React.lazy(() => import('../features/solicitacoes/SolicitacoesMateriais'));
const PerfilTurma = React.lazy(() => import('../features/turmas/PerfilTurma'));
const ChamadaLayout = React.lazy(() => import('../pages/Chamada/ChamadaLayout'));
const ChamadaHome = React.lazy(() => import('../pages/Chamada/ChamadaHome'));
const ChamadaClasse = React.lazy(() => import('../pages/Chamada/ChamadaClasse'));

function AppRoutes() {
  const { session, authLoading, isMaster, userRole } = useAuth();
  
  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Verificando autenticação...</div>;

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const redirectPath = (userRole === 'secretaria' || userRole === 'tecnico') ? "/turmas" : "/";
  const hasEquipamentosAccess = userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'gestao' || userRole === 'professor';

  return (
    <GlobalDataProvider>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Carregando interface...</div>}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="eventos" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <Eventos />} />
            <Route path="eventos/novo" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <Eventos />} />
            <Route path="eventos/editar/:id" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <Eventos />} />
            <Route path="registros" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <Registros />} />
            <Route path="ocorrencias" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <HistoricoOcorrencias />} />
            <Route path="reposicoes" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <EnvioQuestoes />} />
            <Route path="configuracoes" element={(isMaster || userRole === 'gestao' || userRole === 'secretaria') ? <Configuracoes /> : <Navigate to="/" replace />} />
            <Route path="turmas" element={userRole === 'agente' ? <Navigate to="/" replace /> : <Turmas />} />
            <Route path="mapa-classe" element={<MapaClasse />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="acervo" element={<Acervo />} />
            <Route path="biblioteca" element={(userRole === 'gestao' || userRole === 'biblioteca' || userRole === 'secretaria') ? <Biblioteca /> : <Navigate to="/" replace />} />
            <Route path="chamada" element={<ChamadaLayout />}>
              <Route index element={<ChamadaHome />} />
              <Route path="classe/:classId" element={<ChamadaClasse />} />
            </Route>
            <Route path="equipamentos" element={hasEquipamentosAccess ? <Equipamentos /> : <Navigate to={userRole === 'agente' ? "/" : "/turmas"} replace />} />
            <Route path="solicitacoes-materiais" element={<SolicitacoesMateriais />} />
            <Route path="perfil-turma" element={(userRole === 'gestao' || userRole === 'professor') ? <PerfilTurma /> : <Navigate to="/" replace />} />
            <Route path="relatorios" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <Relatorios />} />
            <Route path="boas-praticas" element={(userRole === 'secretaria' || userRole === 'tecnico' || userRole === 'agente') ? <Navigate to={redirectPath} replace /> : <BoasPraticas />} />
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
        <GoogleAuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
            <InstallPWA />
          </BrowserRouter>
        </GoogleAuthProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
