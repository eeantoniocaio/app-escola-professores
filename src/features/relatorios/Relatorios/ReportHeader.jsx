import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReportHeader() {
  const navigate = useNavigate();
  return (
    <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
      <div className="dashboard-title-section">
        <button className="btn-back-home" onClick={() => navigate('/')} title="Voltar ao início">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div>
          <h2 style={{ margin: 0 }}>Relatórios e Estatísticas</h2>
        </div>
      </div>
    </div>
  );
}
