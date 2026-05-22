import React, { useState } from 'react';
import BoasPraticasModal from './BoasPraticasModal';
import { PlusCircle, Calendar, BookOpen, BarChart2, ShieldAlert, Users, AlertTriangle, PenTool, Star } from 'lucide-react';

export default function Home({ setView, openEventModal, openOcorrenciaModal, userRole, professores = [], turmas = [] }) {
  const [isBoasPraticasOpen, setIsBoasPraticasOpen] = useState(false);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="welcome-section" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Painel de Evidências</h2>
        <p style={{ color: 'var(--text-muted)' }}>Acesse rapidamente as principais áreas do sistema.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', padding: '0 1rem' }}>
        {userRole === 'gestao' && (
          <>
            <button className="dashboard-action-card" onClick={() => openEventModal()}>
              <PlusCircle />
              <span>Novo Evento</span>
            </button>
            <button className="dashboard-action-card" onClick={() => setView('eventos')}>
              <Calendar />
              <span>Eventos</span>
            </button>
            <button className="dashboard-action-card" onClick={() => setView('registros')}>
              <BookOpen />
              <span>Registros</span>
            </button>
            <button className="dashboard-action-card" onClick={() => setView('relatorios')}>
              <BarChart2 />
              <span>Relatórios</span>
            </button>
            <button className="dashboard-action-card" onClick={() => setView('historico-ocorrencias')}>
              <ShieldAlert />
              <span>Histórico de Ocorrências</span>
            </button>
          </>
        )}

        <button className="dashboard-action-card" onClick={() => setView('mapa-de-classe')}>
          <Users />
          <span>Mapa de Classe</span>
        </button>

        <button className="dashboard-action-card" onClick={() => openOcorrenciaModal()}>
          <AlertTriangle />
          <span style={{ textAlign: 'center' }}>Ocorrências em Sala</span>
        </button>

        <button className="dashboard-action-card" onClick={() => setView('envio-questoes')}>
          <PenTool />
          <span style={{ textAlign: 'center', fontSize: '1rem' }}>Envio de Reposições</span>
        </button>

        <button className="dashboard-action-card" onClick={() => setIsBoasPraticasOpen(true)}>
          <Star />
          <span>Boas Práticas</span>
        </button>
      </div>

      <BoasPraticasModal 
        isOpen={isBoasPraticasOpen} 
        onClose={() => setIsBoasPraticasOpen(false)} 
        professores={professores}
        turmas={turmas}
      />
    </div>
  );
}
