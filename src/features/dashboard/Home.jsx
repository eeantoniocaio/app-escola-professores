import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  BookOpen,
  BarChart2,
  ShieldAlert,
  Users,
  PenTool,
  Star,
  GraduationCap,
  FolderOpen,
  Wrench,
  CheckSquare,
  Library,
  UserCheck,
  ClipboardList,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';

export default function Home() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const handleEquipamentosClick = () => {
    navigate('/equipamentos');
  };

  const cards = [
    {
      title: 'Novo Evento',
      icon: PlusCircle,
      onClick: () => navigate('/eventos/novo'),
      visible: userRole === 'gestao',
    },
    {
      title: 'Registros',
      icon: BookOpen,
      onClick: () => navigate('/registros'),
      visible: userRole === 'gestao',
    },
    {
      title: 'Relatórios',
      icon: BarChart2,
      onClick: () => navigate('/relatorios'),
      visible: userRole === 'gestao',
    },
    {
      title: 'Chamada',
      icon: CheckSquare,
      onClick: () => navigate('/chamada'),
      visible: userRole === 'gestao' || userRole === 'agente',
    },
    {
      title: 'Eventos',
      icon: Calendar,
      onClick: () => navigate('/eventos'),
      visible: userRole === 'gestao' || userRole === 'professor',
    },
    {
      title: 'Turmas',
      icon: GraduationCap,
      onClick: () => navigate('/turmas'),
      visible: userRole !== 'agente' && userRole !== 'biblioteca',
    },
    {
      title: 'Mapa de Classe',
      icon: Users,
      onClick: () => navigate('/mapa-classe'),
      visible: userRole !== 'biblioteca',
    },
    {
      title: 'Documentos',
      icon: FolderOpen,
      onClick: () => navigate('/documentos'),
      visible: userRole !== 'biblioteca',
    },
    {
      title: 'Acervo',
      icon: Library,
      onClick: () => navigate('/acervo'),
      visible: userRole !== 'biblioteca',
    },
    {
      title: 'Projetos da Escola',
      icon: FolderKanban,
      onClick: () => navigate('/projetos'),
      visible: true,
    },
    {
      title: 'Solicitação de materiais ou serviços',
      icon: ClipboardList,
      onClick: () => navigate('/solicitacoes-materiais'),
      visible: true,
    },
    {
      title: 'Perfil da Turma',
      icon: UserCheck,
      onClick: () => navigate('/perfil-turma'),
      visible: userRole === 'gestao' || userRole === 'professor',
    },
    {
      title: 'Biblioteca',
      icon: BookOpen,
      onClick: () => navigate('/biblioteca'),
      visible: userRole === 'gestao' || userRole === 'biblioteca' || userRole === 'secretaria',
    },
    {
      title: 'Equipamentos',
      icon: Wrench,
      onClick: handleEquipamentosClick,
      visible: userRole === 'gestao' || userRole === 'tecnico' || userRole === 'secretaria' || userRole === 'professor',
    },
    {
      title: 'Empréstimos',
      icon: ClipboardList,
      onClick: () => navigate('/equipamentos?tab=emprestimos'),
      visible: userRole === 'gestao' || userRole === 'tecnico' || userRole === 'secretaria' || userRole === 'professor',
    },
    {
      title: 'Ocorrências',
      icon: ShieldAlert,
      onClick: () => navigate('/ocorrencias'),
      visible: userRole !== 'secretaria' && userRole !== 'tecnico' && userRole !== 'agente' && userRole !== 'biblioteca',
    },
    {
      title: 'Questões de reposições',
      icon: PenTool,
      onClick: () => navigate('/reposicoes'),
      visible: userRole !== 'secretaria' && userRole !== 'tecnico' && userRole !== 'agente' && userRole !== 'biblioteca',
      spanStyle: { textAlign: 'center', fontSize: '1rem' },
    },
    {
      title: 'Boas Práticas',
      icon: Star,
      onClick: () => navigate('/boas-praticas'),
      visible: userRole !== 'secretaria' && userRole !== 'tecnico' && userRole !== 'agente' && userRole !== 'biblioteca',
    },
  ];

  const visibleCards = cards
    .filter((card) => card.visible)
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }));

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="welcome-section" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0' }}>Painel de Evidências</h2>
      </div>

      <div className="dashboard-grid">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <button key={card.title} className="dashboard-action-card" onClick={card.onClick}>
              <Icon />
              <span style={card.spanStyle}>{card.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

