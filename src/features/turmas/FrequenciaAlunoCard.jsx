import React from 'react';
import { Calendar, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function FrequenciaAlunoCard({ data }) {
  if (!data) return null;

  const parsePercentValue = (val) => {
    if (!val || val === '---') return null;
    const num = parseFloat(val.replace('%', '').replace(',', '.'));
    return isNaN(num) ? null : num;
  };

  const getStatusColor = (val) => {
    const num = parsePercentValue(val);
    if (num === null) return 'var(--text-muted, #9CA3AF)';
    return num >= 75 ? '#10B981' : '#EF4444'; // verde ou vermelho
  };

  const getStatusBg = (val) => {
    const num = parsePercentValue(val);
    if (num === null) return 'var(--bg-secondary, #F3F4F6)';
    return num >= 75 ? '#ECFDF5' : '#FEF2F2'; // fundo verde claro ou vermelho claro
  };

  const getStatusBorder = (val) => {
    const num = parsePercentValue(val);
    if (num === null) return 'var(--border-light, #E5E7EB)';
    return num >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
  };

  const bimestres = [
    { label: '1º Bimestre', value: data.frequencia1Bimestre },
    { label: '2º Bimestre', value: data.frequencia2Bimestre },
    { label: '3º Bimestre', value: data.frequencia3Bimestre },
    { label: '4º Bimestre', value: data.frequencia4Bimestre },
  ];

  const finalRate = parsePercentValue(data.frequenciaFinal);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Resumo Principal: Frequência Final e Total de Faltas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        
        {/* Card Frequência Final */}
        <div style={{
          background: getStatusBg(data.frequenciaFinal),
          border: `1px solid ${getStatusBorder(data.frequenciaFinal)}`,
          borderRadius: 'var(--radius-md, 8px)',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition-smooth, all 0.2s)'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #6B7280)', marginBottom: '0.25rem' }}>
            Frequência Final
          </span>
          <div style={{ 
            fontSize: '2.25rem', 
            fontWeight: 800, 
            color: getStatusColor(data.frequenciaFinal),
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {data.frequenciaFinal}
          </div>
          {finalRate !== null && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.75rem', 
              marginTop: '0.35rem',
              fontWeight: 600,
              color: finalRate >= 75 ? '#047857' : '#B91C1C'
            }}>
              {finalRate >= 75 ? (
                <>
                  <CheckCircle2 size={12} /> Aprovado por Frequência
                </>
              ) : (
                <>
                  <XCircle size={12} /> Reprovado por Frequência
                </>
              )}
            </div>
          )}
        </div>

        {/* Card Total de Faltas */}
        <div style={{
          background: 'var(--bg-secondary, #F3F4F6)',
          border: '1px solid var(--border-light, #E5E7EB)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #6B7280)', marginBottom: '0.25rem' }}>
            Total de Faltas
          </span>
          <div style={{ 
            fontSize: '2.25rem', 
            fontWeight: 800, 
            color: data.totalFaltas > 20 ? '#EF4444' : 'var(--text-main, #1F2937)',
            fontFamily: 'monospace'
          }}>
            {data.totalFaltas}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem', 
            fontSize: '0.75rem', 
            marginTop: '0.35rem',
            color: 'var(--text-muted, #6B7280)',
            fontWeight: 600
          }}>
            <Calendar size={12} /> Soma de todos os Totais
          </div>
        </div>

      </div>

      {/* Grid de Frequência por Bimestre */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted, #6B7280)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Frequência por Bimestre
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {bimestres.map((bim, idx) => {
            const numVal = parsePercentValue(bim.value);
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card, #FFFFFF)',
                  border: '1px solid var(--border-light, #E5E7EB)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #374151)' }}>{bim.label}</span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: getStatusColor(bim.value),
                  fontFamily: 'monospace'
                }}>
                  {bim.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
