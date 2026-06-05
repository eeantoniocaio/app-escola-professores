import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar, BookOpen, BarChart2, ShieldAlert, Users, AlertTriangle, PenTool, Star, GraduationCap, FolderOpen, Wrench, CheckSquare, Library, UserCheck, ClipboardList } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';

export default function Home() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const handleEquipamentosClick = () => {
    navigate('/equipamentos');
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="welcome-section" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0' }}>Painel de Evidências</h2>
      </div>

      <div className="dashboard-grid">
        {userRole === 'gestao' && (
          <>
            {/* Navigates to a specific route or we could open a modal context */}
            <button className="dashboard-action-card" onClick={() => navigate('/eventos/novo')}>
              <PlusCircle />
              <span>Novo Evento</span>
            </button>
            <button className="dashboard-action-card" onClick={() => navigate('/eventos')}>
              <Calendar />
              <span>Eventos</span>
            </button>
            <button className="dashboard-action-card" onClick={() => navigate('/registros')}>
              <BookOpen />
              <span>Registros</span>
            </button>
            <button className="dashboard-action-card" onClick={() => navigate('/relatorios')}>
              <BarChart2 />
              <span>Relatórios</span>
            </button>
            <button className="dashboard-action-card" onClick={() => navigate('/chamada')}>
              <CheckSquare />
              <span>Chamada</span>
            </button>
          </>
        )}

        <button className="dashboard-action-card" onClick={() => navigate('/turmas')}>
          <GraduationCap />
          <span>Turmas</span>
        </button>

        <button className="dashboard-action-card" onClick={() => navigate('/mapa-classe')}>
          <Users />
          <span>Mapa de Classe</span>
        </button>

        <button className="dashboard-action-card" onClick={() => navigate('/documentos')}>
          <FolderOpen />
          <span>Documentos</span>
        </button>

        <button className="dashboard-action-card" onClick={() => showToast('Funcionalidade em desenvolvimento', 'info')}>
          <Library />
          <span>Acervo</span>
        </button>

        <button className="dashboard-action-card" onClick={() => showToast('Em desenvolvimento', 'info')}>
          <ClipboardList />
          <span>Solicitação de materiais ou serviços</span>
        </button>

        {(userRole === 'gestao' || userRole === 'professor') && (
          <button className="dashboard-action-card" onClick={() => showToast('Funcionalidade em desenvolvimento', 'info')}>
            <UserCheck />
            <span>Perfil da Turma</span>
          </button>
        )}

        {(userRole === 'gestao' || userRole === 'tecnico' || userRole === 'secretaria' || userRole === 'professor') && (
          <button className="dashboard-action-card" onClick={handleEquipamentosClick}>
            <Wrench />
            <span>Equipamentos</span>
          </button>
        )}

        {userRole !== 'secretaria' && userRole !== 'tecnico' && (
          <>
            <button className="dashboard-action-card" onClick={() => navigate('/ocorrencias')}>
              <ShieldAlert />
              <span>Ocorrências</span>
            </button>

            <button className="dashboard-action-card" onClick={() => navigate('/reposicoes')}>
              <PenTool />
              <span style={{ textAlign: 'center', fontSize: '1rem' }}>Questões de reposições</span>
            </button>

            <button className="dashboard-action-card" onClick={() => navigate('/boas-praticas')}>
              <Star />
              <span>Boas Práticas</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
