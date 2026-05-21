import React from 'react';

export default function ReportSummaryCards({ total, pendentes, entregues, atrasados }) {
  const cardStyle = {
    flex: '1 1 200px',
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    border: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const titleStyle = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const valueStyle = {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--text-dark)',
    lineHeight: 1
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
      <div style={{ ...cardStyle, borderLeft: '4px solid #A7D0D9' }}>
        <span style={titleStyle}>Total de Registros</span>
        <span style={valueStyle}>{total}</span>
      </div>
      <div style={{ ...cardStyle, borderLeft: '4px solid #97F294' }}>
        <span style={titleStyle}>Entregues</span>
        <span style={valueStyle}>{entregues}</span>
      </div>
      <div style={{ ...cardStyle, borderLeft: '4px solid #F2CA7E' }}>
        <span style={titleStyle}>Pendentes</span>
        <span style={valueStyle}>{pendentes}</span>
      </div>
      <div style={{ ...cardStyle, borderLeft: '4px solid #F2BBC9' }}>
        <span style={titleStyle}>Atrasados</span>
        <span style={valueStyle}>{atrasados}</span>
      </div>
    </div>
  );
}
