import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar, BookOpen, BarChart2, ShieldAlert, Users, AlertTriangle, PenTool, Star, GraduationCap } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';

export default function Home() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="welcome-section" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Painel de Evidências</h2>
        <p style={{ color: 'var(--text-muted)' }}>Acesse rapidamente as principais áreas do sistema.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', padding: '0 1rem' }}>
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

        {userRole !== 'secretaria' && (
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
