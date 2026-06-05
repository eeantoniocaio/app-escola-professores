import React from 'react'

export default function FichaPrintReport({
  aluno,
  photoUrl,
  raDisplay,
  birthDateDisplay,
  ageDisplay,
  details,
  attendanceData,
}) {
  return (
    <div className="print-report-only">
      {/* Cabeçalho Oficial */}
      <div style={{
        borderBottom: '2px solid #000000',
        paddingBottom: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase' }}>E.E. ANTÔNIO CAIO</h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '11pt', color: '#555555', fontWeight: 600 }}>
            Ficha de Prontuário e Histórico Escolar
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10pt', color: '#555555' }}>
          Emissão: {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Dados Principais do Aluno e Foto */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
        {photoUrl && (
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid #000000',
            flexShrink: 0
          }}>
            <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '11pt' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <strong>Nome Completo:</strong> {aluno.nome}
          </div>
          <div>
            <strong>Turma:</strong> {aluno.turma}
          </div>
          <div>
            <strong>R.A. (Registro do Aluno):</strong> {raDisplay}
          </div>
          <div>
            <strong>Data de Nascimento:</strong> {birthDateDisplay}
          </div>
          <div>
            <strong>Idade:</strong> {ageDisplay}
          </div>
        </div>
      </div>

      {/* Dados de Contato e Responsáveis */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid #000000', paddingBottom: '0.25rem', marginBottom: '0.75rem', fontSize: '12pt', fontWeight: 'bold' }}>
          Dados de Contato & Responsáveis
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', fontSize: '10.5pt' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <strong>Responsável Legal:</strong> {details.parentName}
          </div>
          <div>
            <strong>Telefone:</strong> {details.phone}
          </div>
          <div>
            <strong>E-mail:</strong> {details.email}
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <strong>Endereço:</strong> {details.address}
          </div>
        </div>
      </div>

      {/* Boletim Escolar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid #000000', paddingBottom: '0.25rem', marginBottom: '0.75rem', fontSize: '12pt', fontWeight: 'bold' }}>
          Boletim Escolar
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '1.5px solid #000000' }}>
              <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left' }}>Componente Curricular</th>
              <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>1º Bim</th>
              <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>2º Bim</th>
              <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>3º Bim</th>
              <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>4º Bim</th>
              <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>Média</th>
              <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {details.boletim.map((bp, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ border: '1px solid #000000', padding: '6px', fontWeight: 'bold' }}>{bp.subject}</td>
                <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b1}</td>
                <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b2}</td>
                <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b3}</td>
                <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.b4}</td>
                <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{bp.media}</td>
                <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{bp.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Frequência */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #000000', paddingBottom: '0.25rem', marginBottom: '0.75rem', fontSize: '12pt', fontWeight: 'bold' }}>
          Frequência e Assiduidade
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', fontSize: '10pt', textAlign: 'center' }}>
          <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>1º Bimestre</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia1Bimestre : '---'}</div>
          </div>
          <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>2º Bimestre</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia2Bimestre : '---'}</div>
          </div>
          <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>3º Bimestre</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia3Bimestre : '---'}</div>
          </div>
          <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>4º Bimestre</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequencia4Bimestre : '---'}</div>
          </div>
          <div style={{ border: '1px solid #000000', padding: '8px', borderRadius: '4px', backgroundColor: '#f2f2f2' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', marginBottom: '4px' }}>Freq. Final</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{attendanceData ? attendanceData.frequenciaFinal : '---'}</div>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '10.5pt', textAlign: 'right' }}>
          <strong>Total de Faltas no Ano:</strong> {attendanceData ? attendanceData.totalFaltas : 0} falta(s)
        </div>
      </div>

      {/* Assinaturas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '4rem', fontSize: '10pt', textAlign: 'center' }}>
        <div>
          <div style={{ borderTop: '1px solid #000000', width: '200px', margin: '0 auto', paddingTop: '4px' }}>
            Secretaria Escolar
          </div>
        </div>
        <div>
          <div style={{ borderTop: '1px solid #000000', width: '200px', margin: '0 auto', paddingTop: '4px' }}>
            Direção de Escola
          </div>
        </div>
      </div>

      {/* Estilos CSS embutidos para impressão */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .print-report-only {
            display: none !important;
          }
        }
        @media print {
          #root {
            display: none !important;
          }
          .modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            display: block !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .modal-content {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            background: white !important;
          }
          .modal-content > *:not(.print-report-only) {
            display: none !important;
          }
          .print-report-only {
            display: block !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
          }
        }
      ` }} />
    </div>
  )
}
