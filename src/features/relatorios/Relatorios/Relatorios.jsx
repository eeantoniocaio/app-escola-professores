import React, { useState } from 'react';
import ReportHeader from './ReportHeader';
import ReportSummaryCards from './ReportSummaryCards';
import ReportFilters from './ReportFilters';
import ReportTable from './ReportTable';
import { exportCSV, exportPDF } from './exportUtils';
import { useRegistros } from '../../../registros/hooks/useRegistros';
import { useEventos } from '../../../eventos/hooks/useEventos';
import { useGlobalData } from '../../../../app/providers/GlobalDataProvider';

export default function Relatorios() {
  const { records } = useRegistros();
  const { events } = useEventos();
  const { professores, tiposEvidencia } = useGlobalData();
  // filters
  const [filterEvent, setFilterEvent] = useState('todos');
  const [filterTeacher, setFilterTeacher] = useState('todos');
  const [filterDate, setFilterDate] = useState('');
  const [filterSolicitante, setFilterSolicitante] = useState('todos');
  const [filterDataSolicitacao, setFilterDataSolicitacao] = useState('');
  const [filterPrazoEntrega, setFilterPrazoEntrega] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Derive solicitantes
  const solicitantes = [...new Set(events.map(e => e.quemSolicitou).filter(Boolean))];

  // ── Build unified rows ────────────────────────────────────────────────────
  const recordRows = records.map(rec => {
    const ev = events.find(e => e.id === rec.eventId);
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
    };
  });

  const lateRows = [];
  events.forEach(ev => {
    if (ev.entregouForaDoPrazo && ev.entregouForaDoPrazo.length > 0) {
      ev.entregouForaDoPrazo.forEach(teacher => {
        lateRows.push({
          id: `late-${ev.id}-${teacher}`,
          teacher,
          evento: ev.evento,
          eventId: ev.id,
          tipo: '⚠️ Entrega fora do prazo',
          date: ev.dataEntrega || null,
          solicitante: ev.quemSolicitou || '-',
          dataSolicitacao: ev.dataSolicitacao || null,
          prazoEntrega: ev.dataEntrega || null,
          gestor: '-',
          description: '-',
          fileName: null,
          fileSize: null,
          source: 'late',
          foraDoPlaz: true,
        });
      });
    }
  });

  const allRows = [...recordRows, ...lateRows];

  const filteredRows = allRows.filter(row => {
    const matchEvent = filterEvent === 'todos' || row.eventId?.toString() === filterEvent;
    const matchTeacher = filterTeacher === 'todos' || row.teacher === filterTeacher;
    const matchDate = !filterDate || row.date === filterDate;
    const matchSolicitante = filterSolicitante === 'todos' || row.solicitante === filterSolicitante;
    const matchDataSolicitacao = !filterDataSolicitacao || row.dataSolicitacao === filterDataSolicitacao;
    const matchPrazoEntrega = !filterPrazoEntrega || row.prazoEntrega === filterPrazoEntrega;
    const matchTipo = filterTipo === 'todos' || row.tipo === filterTipo;

    return matchEvent && matchTeacher && matchDate && matchSolicitante && matchDataSolicitacao && matchPrazoEntrega && matchTipo;
  });

  const hasActiveFilters = filterEvent !== 'todos' || filterTeacher !== 'todos' || filterDate !== '' || filterSolicitante !== 'todos' || filterDataSolicitacao !== '' || filterPrazoEntrega !== '' || filterTipo !== 'todos';

  const clearFilters = () => {
    setFilterEvent('todos');
    setFilterTeacher('todos');
    setFilterDate('');
    setFilterSolicitante('todos');
    setFilterDataSolicitacao('');
    setFilterPrazoEntrega('');
    setFilterTipo('todos');
  };

  const handleExportCSV = () => {
    exportCSV(filteredRows);
  };

  const handleExportPDF = () => {
    exportPDF(filteredRows, {
      filterTeacher, filterTipo, filterDate, filterEvent, filterSolicitante, events
    });
  };

  // Metrics for Summary Cards
  const total = filteredRows.length;
  const atrasados = filteredRows.filter(r => r.foraDoPlaz).length;
  // Let's assume all records that are not "foraDoPlaz" are "entregues". 
  // If there's a "Pendente" type, we can filter for it.
  const pendentes = filteredRows.filter(r => r.tipo.toLowerCase().includes('pendente')).length;
  const entregues = total - atrasados - pendentes; // Rough estimation based on user request

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <ReportHeader />
      
      <ReportSummaryCards 
        total={total} 
        pendentes={pendentes} 
        entregues={entregues} 
        atrasados={atrasados} 
      />

      <ReportFilters 
        events={events} 
        professores={professores} 
        solicitantes={solicitantes} 
        tiposEvidencia={tiposEvidencia}
        filterEvent={filterEvent} setFilterEvent={setFilterEvent}
        filterTeacher={filterTeacher} setFilterTeacher={setFilterTeacher}
        filterDate={filterDate} setFilterDate={setFilterDate}
        filterSolicitante={filterSolicitante} setFilterSolicitante={setFilterSolicitante}
        filterDataSolicitacao={filterDataSolicitacao} setFilterDataSolicitacao={setFilterDataSolicitacao}
        filterPrazoEntrega={filterPrazoEntrega} setFilterPrazoEntrega={setFilterPrazoEntrega}
        filterTipo={filterTipo} setFilterTipo={setFilterTipo}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-dark)' }}>Resultados ({total})</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Exportar CSV
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
            </svg>
            Gerar PDF
          </button>
        </div>
      </div>

      <ReportTable rows={filteredRows} />
    </div>
  );
}
