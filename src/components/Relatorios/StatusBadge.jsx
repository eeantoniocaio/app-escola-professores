import React from 'react';

export default function StatusBadge({ tipo, foraDoPrazo }) {
  if (foraDoPrazo) {
    return (
      <span style={{ 
        background: '#FFDEE9', 
        color: '#8B3A52', 
        padding: '0.25rem 0.75rem', 
        borderRadius: '20px', 
        fontSize: '0.78rem', 
        fontWeight: 700, 
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        border: '1px solid rgba(139, 58, 82, 0.15)'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Entrega fora do prazo
      </span>
    );
  }

  // Other dynamic styling depending on tipo (could be customized later)
  return (
    <span style={{ 
      background: '#E6E6FA', 
      color: '#4a3f8a', 
      padding: '0.25rem 0.6rem', 
      borderRadius: '6px', 
      fontSize: '0.78rem', 
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      border: '1px solid rgba(74, 63, 138, 0.1)'
    }}>
      {tipo}
    </span>
  );
}
