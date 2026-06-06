import React from 'react';
import StatusBadge from './StatusBadge';

export default function ReportTable({ rows }) {
  const thStyle = {
    padding: '1rem 0.75rem',
    whiteSpace: 'nowrap',
    color: 'var(--text-muted)',
    fontWeight: 700,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid var(--border-light)'
  };

  const tdStyle = {
    padding: '1rem 0.75rem',
    verticalAlign: 'top',
    fontSize: '0.9rem'
  };

  return (
    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', padding: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid var(--border-light)' }} className="print-area">
      <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            <th style={thStyle}>Professor(a)</th>
            <th style={thStyle}>Status / Tipo</th>
            <th style={thStyle}>Data</th>
            <th style={thStyle}>Gestor(a)</th>
            <th style={thStyle}>Evento</th>
            <th style={thStyle}>Solicitante</th>
            <th style={thStyle}>Prazo</th>
            <th style={thStyle}>Descrição</th>
            <th style={thStyle}>Anexo</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row, index) => (
            <tr key={row.id} style={{ 
              borderBottom: '1px solid var(--border-light)', 
              background: row.foraDoPlaz ? 'rgba(255, 222, 233, 0.3)' : (index % 2 === 0 ? '#fafafa' : '#fff'),
              transition: 'background 0.2s'
            }}>
              <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text-dark)' }}>{row.teacher}</td>
              <td style={tdStyle}>
                <StatusBadge tipo={row.tipo} foraDoPrazo={row.foraDoPlaz} />
              </td>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.gestor || '-'}</td>
              <td style={tdStyle}>{row.evento}</td>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.solicitante}</td>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.prazoEntrega ? new Date(row.prazoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
              <td style={{ ...tdStyle, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '250px', lineHeight: '1.4' }}>{row.description || '-'}</td>
              <td style={{ ...tdStyle, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                {row.fileName
                  ? <span style={{ background: '#F2EBC4', color: '#7a6a10', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, display: 'inline-block' }}>📎 {row.fileName}</span>
                  : <span style={{ color: 'var(--text-light)' }}>-</span>
                }
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="9" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Nenhum registro encontrado</div>
                <div style={{ fontSize: '0.9rem' }}>Tente ajustar ou limpar os filtros para ver mais resultados.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
