import React from 'react'
import { User, Calendar, Phone, Mail, MapPin } from 'lucide-react'

export default function FichaCadastralTab({ aluno, details, birthDateDisplay, ageDisplay, raDisplay }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
      
      {/* Seção Dados Pessoais */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '1rem', fontWeight: 700 }}>
          <User size={18} /> Dados Pessoais
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Nome Completo</label>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{aluno.nome}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Data de Nascimento</label>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} color="var(--text-light)" /> {birthDateDisplay}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Idade</label>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{ageDisplay}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>R.A. (Registro do Aluno)</label>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{raDisplay}</div>
          </div>
        </div>
      </div>

      {/* Seção Contato & Endereço */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '1rem', fontWeight: 700 }}>
          <Phone size={18} /> Dados de Contato & Responsáveis
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Responsável Legal</label>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{details.parentName}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Telefone do Responsável</label>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={14} color="var(--text-light)" /> {details.phone}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>E-mail para Recados</label>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
              <Mail size={14} color="var(--text-light)" style={{ flexShrink: 0 }} /> {details.email}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Endereço Residencial</label>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <MapPin size={14} color="var(--text-light)" style={{ marginTop: '0.15rem', flexShrink: 0 }} /> {details.address}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
