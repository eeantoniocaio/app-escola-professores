import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChamadaContext } from './context/ChamadaContext';
import { Users, ChevronRight, FileText } from 'lucide-react';
import ReportModal from '../../components/chamada/ReportModal';

export default function ChamadaHome() {
    const { classes, loadingClasses } = useChamadaContext();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    if (loadingClasses) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                    <p style={{ color: 'var(--text-muted)' }}>Carregando turmas do portal...</p>
                </div>
            </div>
        );
    }

    const accentColors = [
        'var(--accent-pink)',
        'var(--accent-yellow)',
        'var(--accent-blue)',
        'var(--accent-green)',
        'var(--accent-purple)'
    ];

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
            <header className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="page-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Chamada Escolar</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Sincronizado diretamente com a Planilha de Frequência do Google Sheets</p>
                </div>
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="btn btn-secondary"
                    style={{
                        padding: '10px 16px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600
                    }}
                >
                    <FileText size={18} />
                    <span>Relatórios</span>
                </button>
            </header>

            {classes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Nenhuma turma cadastrada no Portal.</p>
                    <Link to="/configuracoes" className="btn btn-primary">
                        Cadastrar Turmas
                    </Link>
                </div>
            ) : (
                <div className="class-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {classes.map((cls) => {
                        const name = cls.name.toUpperCase();
                        let bg = 'var(--bg-card)';

                        // Class card color mapping
                        if (name.includes('6º') || name.includes('6 ')) bg = '#FFC0CB'; // Pink
                        else if (name.includes('7º') || name.includes('7 ')) bg = '#FFD580'; // Yellow/Orange
                        else if (name.includes('8º') || name.includes('8 ')) bg = '#ADD8E6'; // Blue
                        else if (name.includes('9º') || name.includes('9 ')) bg = '#90EE90'; // Green
                        else if (name.includes('1º') || name.includes('1 ')) bg = '#E6E6FA'; // Purple (High School)
                        else if (name.includes('2º') || name.includes('2 ')) bg = '#FFDEE9'; // Soft Pink
                        else if (name.includes('3º') || name.includes('3 ')) bg = '#FFFACD'; // Soft Yellow
                        else if (name.includes('ACDA')) bg = '#E0F2F1'; // Teal
                        else if (name.includes('FANFARRA')) bg = '#F3E5F5'; // Lavender
                        else {
                            const hash = name.length + (name.charCodeAt(0) || 0);
                            bg = accentColors[hash % accentColors.length];
                        }

                        return (
                            <Link key={cls.id} to={`/chamada/classe/${cls.name}`} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{
                                    backgroundColor: bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(0,0,0,0.04)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.08)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)';
                                }}
                                >
                                    <div style={{ color: '#111' }}>
                                        <h3 style={{ fontSize: '1.35rem', marginBottom: '6px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{cls.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75, fontSize: '0.88rem', fontWeight: 600 }}>
                                            <Users size={16} />
                                            <span>Entrar na chamada</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: 'rgba(255,255,255,0.45)',
                                        borderRadius: '50%',
                                        padding: '8px',
                                        display: 'flex',
                                        color: '#111'
                                    }}>
                                        <ChevronRight size={20} strokeWidth={2.5} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        </div>
    );
}
