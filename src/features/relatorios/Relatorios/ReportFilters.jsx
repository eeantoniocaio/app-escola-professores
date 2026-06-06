import React from 'react';

export default function ReportFilters({
  events, professores, solicitantes, tiposEvidencia,
  filterEvent, setFilterEvent,
  filterTeacher, setFilterTeacher,
  filterDate, setFilterDate,
  filterSolicitante, setFilterSolicitante,
  filterDataSolicitacao, setFilterDataSolicitacao,
  filterPrazoEntrega, setFilterPrazoEntrega,
  filterTipo, setFilterTipo,
  clearFilters, hasActiveFilters
}) {
  const labelStyle = { 
    display: 'block', 
    fontSize: '0.75rem', 
    fontWeight: 700, 
    color: 'var(--text-muted)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em',
    marginBottom: '0.4rem' 
  };

  const wrapperStyle = { flex: '1 1 180px' };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-4 p-6 bg-white border border-gray-200 rounded-[12px] shadow-sm mb-8">
      <div className="flex-1 min-w-[140px]">
        <label style={labelStyle}>Professor(a)</label>
        <select className="select-filter" style={{ width: '100%' }} value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
          <option value="todos">Todos</option>
          {professores.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label style={labelStyle}>Tipo</label>
        <select className="select-filter" style={{ width: '100%' }} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="todos">Todos</option>
          {tiposEvidencia.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label style={labelStyle}>Data do Registro</label>
        <input type="date" className="select-filter" style={{ width: '100%' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
      </div>

      <div className="flex-1 min-w-[140px]">
        <label style={labelStyle}>Evento Vinculado</label>
        <select className="select-filter" style={{ width: '100%' }} value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
          <option value="todos">Todos</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.evento}</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label style={labelStyle}>Solicitante</label>
        <select className="select-filter" style={{ width: '100%' }} value={filterSolicitante} onChange={e => setFilterSolicitante(e.target.value)}>
          <option value="todos">Todos</option>
          {solicitantes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label style={labelStyle}>Prazo Limite</label>
        <input type="date" className="select-filter" style={{ width: '100%' }} value={filterPrazoEntrega} onChange={e => setFilterPrazoEntrega(e.target.value)} />
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="btn btn-secondary w-full sm:w-auto" style={{ padding: '0.65rem 1.25rem', height: 'fit-content' }}>
          Limpar Filtros
        </button>
      )}
    </div>
  );
}
