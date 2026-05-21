import React, { useState } from 'react'

export default function Relatorios({ setView, records, events, professores, tiposEvidencia }) {
  // filters
  const [filterEvent, setFilterEvent] = useState('todos')
  const [filterTeacher, setFilterTeacher] = useState('todos')
  const [filterDate, setFilterDate] = useState('')
  const [filterSolicitante, setFilterSolicitante] = useState('todos')
  const [filterDataSolicitacao, setFilterDataSolicitacao] = useState('')
  const [filterPrazoEntrega, setFilterPrazoEntrega] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')

  // Derive solicitantes
  const solicitantes = [...new Set(events.map(e => e.quemSolicitou).filter(Boolean))]

  // ── Build unified rows ────────────────────────────────────────────────────
  // Source 1: evidence records (as before)
  const recordRows = records.map(rec => {
    const ev = events.find(e => e.id === rec.eventId)
    return {
      id: `rec-${rec.id}`,
      teacher: rec.teacher,
      evento: ev ? ev.evento : '-',
      eventId: rec.eventId,
      tipo: rec.tipo || '-',
      date: rec.date,
      solicitante: ev ? ev.quemSolicitou : '-',
      dataSolicitacao: ev ? ev.dataSolicitacao : null,
      prazoEntrega: ev ? ev.dataEntrega : null,
      gestor: rec.gestor || '-',
      description: rec.description || '-',
      fileName: rec.fileName || null,
      fileSize: rec.fileSize || null,
      source: 'record',
      foraDoPlaz: false,
    }
  })

  // Source 2: late-delivery entries from events
  const lateRows = []
  events.forEach(ev => {
    if (ev.entregouForaDoPrazo && ev.entregouForaDoPrazo.length > 0) {
      ev.entregouForaDoPrazo.forEach(teacher => {
        // Only add if there is NO evidence record for this teacher+event already
        // (We always add it — it's a separate annotation, not a duplicate)
        lateRows.push({
          id: `late-${ev.id}-${teacher}`,
          teacher,
          evento: ev.evento,
          eventId: ev.id,
          tipo: '⚠️ Entrega fora do prazo',
          date: ev.dataEntrega || null,   // use the deadline as reference date
          solicitante: ev.quemSolicitou || '-',
          dataSolicitacao: ev.dataSolicitacao || null,
          prazoEntrega: ev.dataEntrega || null,
          source: 'late',
          foraDoPlaz: true,
        })
      })
    }
  })

  const allRows = [...recordRows, ...lateRows]

  const filteredRows = allRows.filter(row => {
    const matchEvent = filterEvent === 'todos' || row.eventId?.toString() === filterEvent
    const matchTeacher = filterTeacher === 'todos' || row.teacher === filterTeacher
    const matchDate = !filterDate || row.date === filterDate
    const matchSolicitante = filterSolicitante === 'todos' || row.solicitante === filterSolicitante
    const matchDataSolicitacao = !filterDataSolicitacao || row.dataSolicitacao === filterDataSolicitacao
    const matchPrazoEntrega = !filterPrazoEntrega || row.prazoEntrega === filterPrazoEntrega
    const matchTipo = filterTipo === 'todos' || row.tipo === filterTipo

    return matchEvent && matchTeacher && matchDate && matchSolicitante && matchDataSolicitacao && matchPrazoEntrega && matchTipo
  })

  const hasActiveFilters = filterEvent !== 'todos' || filterTeacher !== 'todos' || filterDate !== '' || filterSolicitante !== 'todos' || filterDataSolicitacao !== '' || filterPrazoEntrega !== '' || filterTipo !== 'todos'

  const clearFilters = () => {
    setFilterEvent('todos')
    setFilterTeacher('todos')
    setFilterDate('')
    setFilterSolicitante('todos')
    setFilterDataSolicitacao('')
    setFilterPrazoEntrega('')
    setFilterTipo('todos')
  }

  const exportCSV = () => {
    const headers = ['Professor(a)', 'Evento', 'Tipo', 'Data', 'Gestor(a)', 'Solicitante', 'Solicitado Em', 'Prazo de Entrega', 'Descrição', 'Anexo'];
    
    const rows = filteredRows.map(row => [
      `"${row.teacher}"`,
      `"${row.evento}"`,
      `"${row.tipo}"`,
      `"${row.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}"`,
      `"${row.gestor || '-'}"`,
      `"${row.solicitante}"`,
      `"${row.dataSolicitacao ? new Date(row.dataSolicitacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}"`,
      `"${row.prazoEntrega ? new Date(row.prazoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}"`,
      `"${row.description || '-'}"`,
      `"${row.fileName ? row.fileName + (row.fileSize ? ' (' + row.fileSize + ')' : '') : '-'}"`
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_evidencias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <style>
        {`
          @media print {
            .header, .dashboard-header, .controls-panel, footer {
              display: none !important;
            }
            body {
              background: white !important;
            }
            .app-container, .main-content {
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-area {
              box-shadow: none !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <button className="btn-back-home" onClick={() => setView('home')} title="Voltar ao início">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div>
            <h2 style={{ marginBottom: '0.1rem' }}>Relatórios</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Filtre e visualize dados detalhados.
            </p>
          </div>
        </div>
      </div>

      <div className="controls-panel" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Eventos</label>
          <select className="select-filter" style={{ width: '100%' }} value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
            <option value="todos">Todos</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.evento}</option>)}
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Professor(a)</label>
          <select className="select-filter" style={{ width: '100%' }} value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
            <option value="todos">Todos</option>
            {professores.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Data</label>
          <input type="date" className="select-filter" style={{ width: '100%' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Solicitante</label>
          <select className="select-filter" style={{ width: '100%' }} value={filterSolicitante} onChange={e => setFilterSolicitante(e.target.value)}>
            <option value="todos">Todos</option>
            {solicitantes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Solicitado Em</label>
          <input type="date" className="select-filter" style={{ width: '100%' }} value={filterDataSolicitacao} onChange={e => setFilterDataSolicitacao(e.target.value)} />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Prazo de Entrega</label>
          <input type="date" className="select-filter" style={{ width: '100%' }} value={filterPrazoEntrega} onChange={e => setFilterPrazoEntrega(e.target.value)} />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Tipo</label>
          <select className="select-filter" style={{ width: '100%' }} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
            <option value="todos">Todos</option>
            {tiposEvidencia.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn btn-secondary" style={{ padding: '0.65rem 1rem', height: 'fit-content' }}>
            Limpar Filtros
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className="print-area">
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Resultados ({filteredRows.length})</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Baixar CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
            </svg>
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', padding: '1rem', boxShadow: 'var(--shadow-sm)' }} className="print-area">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Professor(a)</th>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Data</th>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Tipo</th>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Gestor(a)</th>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Evento</th>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Solicitante</th>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Prazo de Entrega</th>
              <th style={{ padding: '0.75rem' }}>Descrição</th>
              <th style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>Anexo</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? filteredRows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)', background: row.foraDoPlaz ? '#fff5f7' : 'transparent', verticalAlign: 'top' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.teacher}</td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{row.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {row.foraDoPlaz
                      ? <span style={{ background: '#FFDEE9', color: '#8B3A52', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>⚠️ Entrega fora do prazo</span>
                      : <span style={{ background: '#E6E6FA', color: '#4a3f8a', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>{row.tipo}</span>
                    }
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{row.gestor || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{row.evento}</td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{row.solicitante}</td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{row.prazoEntrega ? new Date(row.prazoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '220px' }}>{row.description || '-'}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {row.fileName
                      ? <span style={{ background: '#F2EBC4', color: '#7a6a10', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>📎 {row.fileName}</span>
                      : <span style={{ color: 'var(--text-light)' }}>-</span>
                    }
                  </td>
                </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum registro encontrado com estes filtros.
                  <br/><span style={{fontSize:'0.8rem'}}>Tente ajustar ou limpar os filtros.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
