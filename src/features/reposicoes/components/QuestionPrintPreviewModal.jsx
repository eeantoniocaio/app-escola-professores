import React, { useState, useEffect, useRef } from 'react';
import { FileText, Printer, FileDown, ArrowUp, ArrowDown, Trash2, X, Plus } from 'lucide-react';
import { exportQuestionsToPdf } from '../export/exportPdf';
import { exportQuestionsToDocx } from '../export/exportDocx';

export default function QuestionPrintPreviewModal({ selectedQuestions, onClose }) {
  const [questions, setQuestions] = useState([...selectedQuestions]);
  const [config, setConfig] = useState({
    schoolName: 'E.E. ANTÔNIO CAIO',
    examTitle: 'Avaliação Substitutiva / Reposição de Atividades',
    professor: questions[0]?.professor || '',
    disciplina: Array.from(new Set(questions.map(q => q.disciplina).filter(Boolean))).join(', ') || '',
    serie: questions[0]?.serie || '',
    turma: questions[0]?.turma ? questions[0].turma.charAt(questions[0].turma.length - 1) : '',
    date: new Date().toLocaleDateString('pt-BR')
  });

  const printAreaRef = useRef(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  // Sync questions if prop changes
  useEffect(() => {
    setQuestions([...selectedQuestions]);
  }, [selectedQuestions]);

  // Reorder questions
  const moveQuestion = (index, direction) => {
    const updated = [...questions];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setQuestions(updated);
    }
  };

  // Remove question from this export
  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Trigger browser printing
  const handlePrint = () => {
    window.print();
  };

  // Trigger PDF export
  const handleExportPdf = async () => {
    if (!printAreaRef.current) return;
    setExportingPdf(true);
    await exportQuestionsToPdf(printAreaRef.current, config.examTitle);
    setExportingPdf(false);
  };

  // Trigger DOCX export
  const handleExportDocx = async () => {
    setExportingDocx(true);
    await exportQuestionsToDocx(questions, config);
    setExportingDocx(false);
  };

  // Group questions by discipline for print rendering
  const questionsByDiscipline = {};
  questions.forEach(q => {
    const disc = q.disciplina || 'Geral';
    if (!questionsByDiscipline[disc]) {
      questionsByDiscipline[disc] = [];
    }
    questionsByDiscipline[disc].push(q);
  });

  const disciplines = Object.keys(questionsByDiscipline);

  let globalQuestionIndex = 1;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0f172a',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }} className="print-modal-container">
      
      {/* Top Header */}
      <div style={{
        padding: '1rem 2rem',
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#3b82f6', padding: '0.5rem', borderRadius: '8px' }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Gerador de Avaliação Escolar</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Ajuste a ordem das questões e exporte em alta fidelidade</p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', display: 'flex', alignItems: 'center',
            padding: '0.5rem', borderRadius: '50%', transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#334155'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Sidebar Controls */}
        <div style={{
          width: '350px',
          background: '#1e293b',
          borderRight: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '1.5rem',
          gap: '1.5rem',
          flexShrink: 0
        }} className="no-print">
          
          {/* Header Info Customizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados do Cabeçalho</h4>
            
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Nome da Escola</label>
              <input 
                type="text" 
                value={config.schoolName}
                onChange={e => setConfig(prev => ({ ...prev, schoolName: e.target.value }))}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Título da Prova</label>
              <input 
                type="text" 
                value={config.examTitle}
                onChange={e => setConfig(prev => ({ ...prev, examTitle: e.target.value }))}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Professor(a)</label>
                <input 
                  type="text" 
                  value={config.professor}
                  onChange={e => setConfig(prev => ({ ...prev, professor: e.target.value }))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Disciplina</label>
                <input 
                  type="text" 
                  value={config.disciplina}
                  onChange={e => setConfig(prev => ({ ...prev, disciplina: e.target.value }))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Série</label>
                <input 
                  type="text" 
                  value={config.serie}
                  onChange={e => setConfig(prev => ({ ...prev, serie: e.target.value }))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Turma</label>
                <input 
                  type="text" 
                  value={config.turma}
                  onChange={e => setConfig(prev => ({ ...prev, turma: e.target.value }))}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Data</label>
              <input 
                type="text" 
                value={config.date}
                onChange={e => setConfig(prev => ({ ...prev, date: e.target.value }))}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* Reordering Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
            <h4 style={{ margin: '0', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ordenar Questões</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', paddingRight: '4px' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{
                  background: '#0f172a',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>Questão {idx + 1}</div>
                    <div style={{ fontSize: '0.78rem', color: '#e2e8f0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {q.enunciado || 'Sem enunciado'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => moveQuestion(idx, -1)} 
                      disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? '#475569' : '#94a3b8', padding: '0.25rem' }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveQuestion(idx, 1)} 
                      disabled={idx === questions.length - 1}
                      style={{ background: 'none', border: 'none', cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer', color: idx === questions.length - 1 ? '#475569' : '#94a3b8', padding: '0.25rem' }}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button 
                      onClick={() => removeQuestion(q.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0.25rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', border: '1px dashed #334155', borderRadius: '8px' }}>
                  Nenhuma questão selecionada.
                </div>
              )}
            </div>
          </div>

          {/* Export Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #334155', paddingTop: '1.25rem', marginTop: 'auto' }}>
            <button
              onClick={handlePrint}
              disabled={questions.length === 0}
              style={{
                width: '100%',
                background: '#475569',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: questions.length === 0 ? 'not-allowed' : 'pointer',
                opacity: questions.length === 0 ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => { if (questions.length > 0) e.currentTarget.style.backgroundColor = '#334155' }}
              onMouseOut={e => { if (questions.length > 0) e.currentTarget.style.backgroundColor = '#475569' }}
            >
              <Printer size={18} /> Imprimir / Salvar PDF (Nativo)
            </button>

            <button
              onClick={handleExportPdf}
              disabled={questions.length === 0 || exportingPdf}
              style={{
                width: '100%',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: (questions.length === 0 || exportingPdf) ? 'not-allowed' : 'pointer',
                opacity: (questions.length === 0 || exportingPdf) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => { if (questions.length > 0 && !exportingPdf) e.currentTarget.style.backgroundColor = '#0369a1' }}
              onMouseOut={e => { if (questions.length > 0 && !exportingPdf) e.currentTarget.style.backgroundColor = '#0284c7' }}
            >
              <FileDown size={18} /> {exportingPdf ? 'Exportando...' : 'Exportar PDF de Alta Qualidade'}
            </button>

            <button
              onClick={handleExportDocx}
              disabled={questions.length === 0 || exportingDocx}
              style={{
                width: '100%',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: (questions.length === 0 || exportingDocx) ? 'not-allowed' : 'pointer',
                opacity: (questions.length === 0 || exportingDocx) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => { if (questions.length > 0 && !exportingDocx) e.currentTarget.style.backgroundColor = '#15803d' }}
              onMouseOut={e => { if (questions.length > 0 && !exportingDocx) e.currentTarget.style.backgroundColor = '#16a34a' }}
            >
              <FileText size={18} /> {exportingDocx ? 'Gerando Word...' : 'Exportar Word (DOCX)'}
            </button>
          </div>

        </div>

        {/* Paper Sheet Preview Area */}
        <div style={{
          flex: 1,
          background: '#0f172a',
          overflowY: 'auto',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }} className="print-scroll-container">
          
          {/* A4 Sheet Container */}
          <div 
            id="a4-print-sheet"
            ref={printAreaRef}
            style={{
              width: '794px', // Standard pixel width representing A4 at 96 DPI
              minHeight: '1123px', // A4 height at 96 DPI
              background: 'white',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              padding: '30mm 20mm 20mm 30mm', // standard ABNT margins
              color: '#000000',
              fontFamily: '"Times New Roman", Times, serif', // standard institutional test serif font
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* School / Exam Header Block */}
            <div style={{
              border: '1.5px solid #000',
              padding: '12px',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Header Title */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '8px' }}>
                <div style={{ fontSize: '15pt', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
                  {config.schoolName.toUpperCase()}
                </div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', marginTop: '4px' }}>
                  {config.examTitle}
                </div>
              </div>
              
              {/* Metadata Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', fontSize: '10.5pt', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>PROFESSOR(A):</strong> {config.professor.toUpperCase()}</div>
                  <div><strong>DISCIPLINA:</strong> {(config.disciplina || 'Várias').toUpperCase()}</div>
                  <div><strong>SÉRIE/TURMA:</strong> {`${config.serie} ${config.turma}`.toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid #000', paddingLeft: '12px' }}>
                  <div><strong>DATA:</strong> {config.date}</div>
                  <div style={{ marginTop: '2px' }}><strong>NOTA:</strong> _______________</div>
                </div>
              </div>

              {/* Student Name */}
              <div style={{
                borderTop: '1px solid #000',
                paddingTop: '8px',
                fontSize: '11pt',
                fontFamily: 'Arial, sans-serif',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <div><strong>ALUNO(A):</strong> __________________________________________________</div>
                <div><strong>Nº:</strong> ______</div>
              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {disciplines.map(discipline => {
                const disciplineQuestions = questionsByDiscipline[discipline];
                
                return (
                  <React.Fragment key={discipline}>
                    {/* Discipline Header if multiple */}
                    {(disciplines.length > 1 || discipline !== 'Geral') && (
                      <div style={{ 
                        fontFamily: 'Arial, sans-serif', 
                        fontSize: '12pt', 
                        fontWeight: 'bold', 
                        borderBottom: '1.5px solid #000', 
                        paddingBottom: '4px',
                        marginTop: '0.5rem',
                        marginBottom: '0.75rem',
                        color: '#000000',
                        display: 'flex',
                        justifyContent: 'space-between',
                        pageBreakInside: 'avoid'
                      }}>
                        <span>DISCIPLINA: {discipline.toUpperCase()}</span>
                        <span style={{ fontSize: '10pt', fontWeight: 'normal', fontStyle: 'italic' }}>({disciplineQuestions.length} questões)</span>
                      </div>
                    )}

                    {/* Questions */}
                    {disciplineQuestions.map(q => {
                      const curIndex = questions.indexOf(q) + 1;
                      const habText = q.habilidade ? ` (${q.habilidade})` : '';
                      const letters = ['a', 'b', 'c', 'd', 'e'].slice(0, q.num_alternativas || 4);

                      return (
                        <div 
                          key={q.id} 
                          style={{ 
                            pageBreakInside: 'avoid', // Crucial: prevents this block from splitting across pages
                            marginBottom: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* Question Number & Skill */}
                          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                            Questão {curIndex}){habText}
                          </div>

                          {/* Enunciado */}
                          <div style={{ 
                            fontSize: '11pt', 
                            lineHeight: 1.5, 
                            whiteSpace: 'pre-wrap',
                            textAlign: 'justify'
                          }}>
                            {q.enunciado}
                          </div>

                          {/* Image */}
                          {(q.imagem_url || q.imagem_base64) && (
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.75rem 0' }}>
                              <img 
                                src={q.imagem_url || q.imagem_base64} 
                                alt="Apoio"
                                style={{ maxWidth: '85%', maxHeight: '240px', objectFit: 'contain' }}
                              />
                            </div>
                          )}

                          {/* Alternatives */}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '6px', 
                            paddingLeft: '1.5rem',
                            marginTop: '4px'
                          }}>
                            {letters.map(letter => (
                              <div 
                                key={letter} 
                                style={{ 
                                  display: 'flex', 
                                  gap: '8px', 
                                  fontSize: '11pt', 
                                  lineHeight: 1.4,
                                  pageBreakInside: 'avoid'
                                }}
                              >
                                <span style={{ fontWeight: 'bold' }}>{letter})</span>
                                <span>{q.alternativas?.[letter.toUpperCase()] || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {questions.length === 0 && (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '11pt', fontStyle: 'italic' }}>
                  Nenhuma questão selecionada para a prova.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Global CSS Style tag for Printing */}
      <style>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          /* Hide anything except the printable A4 area */
          .no-print, .print-modal-container > *:not(.print-scroll-container) {
            display: none !important;
          }
          .print-scroll-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
          }
          #a4-print-sheet {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20mm 15mm 15mm 20mm !important; /* standard print margins */
            box-sizing: border-box !important;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
