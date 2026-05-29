import React from 'react';
import { FolderOpen, ExternalLink, FileText, Download, ShieldCheck } from 'lucide-react';

export default function Documentos() {
  const sharepointUrl = "https://seducsp-my.sharepoint.com/:f:/g/personal/e017590w10_professor_educacao_sp_gov_br/IgDEQvVMOCUnT7W-mgep5eG1Ab96PZOcdjFdiWRXUjT1GYA?e=BR8Kvj";

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0, marginBottom: '0.5rem' }}>Documentos</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Modelos, diretrizes e formulários compartilhados pela Secretaria e Coordenação.
        </p>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        marginTop: '1rem'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(14, 165, 233, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-color)',
          marginBottom: '0.5rem'
        }}>
          <FolderOpen size={36} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
          Pasta de Arquivos - E.E. Antônio Caio
        </h3>
        
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '500px', margin: 0 }}>
          Acesse a pasta compartilhada no OneDrive/SharePoint institucional da SEDUC-SP para visualizar ou fazer download de documentos oficiais, comunicados e formulários escolares.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem', 
          width: '100%', 
          maxWidth: '450px',
          margin: '0.5rem 0',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
            <FileText size={16} style={{ color: '#0ea5e9' }} />
            <span>Formatos: PDF, Word, Excel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            <span>Domínio: @educacao.sp.gov.br</span>
          </div>
        </div>

        <a 
          href={sharepointUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            padding: '1rem 2rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            marginTop: '0.5rem',
            width: '100%',
            maxWidth: '350px'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.3)';
          }}
        >
          <span>Abrir Pasta de Documentos</span>
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
}
