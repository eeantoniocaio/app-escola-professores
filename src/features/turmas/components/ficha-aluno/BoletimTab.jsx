import React from 'react'
import { Clipboard } from 'lucide-react'

export default function BoletimTab({ details }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '1rem', fontWeight: 700 }}>
            <Clipboard size={18} /> Histórico de Notas (Boletim)
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ano Letivo: {new Date().getFullYear()}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Componente Curricular</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>1º Bim</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>2º Bim</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>3º Bim</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>4º Bim</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Média</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {details.boletim.map((bp, index) => (
                <tr key={index} style={{ borderBottom: index === details.boletim.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{bp.subject}</td>
                  <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b1 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b1}</td>
                  <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b2 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b2}</td>
                  <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b3 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b3}</td>
                  <td style={{ padding: '1rem 1rem', fontSize: '0.9rem', textAlign: 'center', color: bp.b4 < 6 ? 'var(--color-danger)' : 'var(--text-main)' }}>{bp.b4}</td>
                  <td style={{ padding: '1rem 1rem', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center', color: bp.media < 6 ? 'var(--color-danger)' : 'var(--color-success)' }}>{bp.media}</td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: bp.status === 'Aprovado' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                      color: bp.status === 'Aprovado' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                      {bp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
