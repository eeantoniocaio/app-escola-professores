import React from 'react';

export default function ClassFilterPanel({
  selectedSerie,
  setSelectedSerie,
  selectedTurmaSigla,
  setSelectedTurmaSigla,
  sortedSeriesList,
  availableTurmaSiglas
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Série / Ano</label>
          <select 
            value={selectedSerie} 
            onChange={e => { setSelectedSerie(e.target.value); setSelectedTurmaSigla(''); }}
            className="select-filter"
            style={{ width: '100%', padding: '0.65rem 1rem' }}
          >
            <option value="">Selecione...</option>
            {sortedSeriesList.map(serie => (
              <option key={serie} value={serie}>{serie}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Turma</label>
          <select 
            value={selectedTurmaSigla} 
            onChange={e => setSelectedTurmaSigla(e.target.value)}
            disabled={!selectedSerie}
            className="select-filter"
            style={{ width: '100%', padding: '0.65rem 1rem', opacity: selectedSerie ? 1 : 0.6 }}
          >
            <option value="">Selecione...</option>
            {availableTurmaSiglas.map(sigla => (
              <option key={sigla} value={sigla}>{sigla}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
