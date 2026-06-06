import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChamadaContext } from './context/ChamadaContext';
import { ChevronLeft, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../../app/providers/ToastProvider';

export default function ChamadaClasse() {
    const { classId } = useParams(); // classId contains the className (e.g., "6º Ano A")
    const { classes, classAttendance, loadingAttendance, fetchAttendance, toggleAttendance } = useChamadaContext();
    const { showToast } = useToast();

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [savingIds, setSavingIds] = useState(new Set()); // Tracks student RAs being saved in background
    const [loadError, setLoadError] = useState(null);

    const key = `${classId}_${date}`;
    const studentsList = classAttendance[key] || [];
    const isLoading = loadingAttendance[key];

    // Fetch student data on class and date change
    useEffect(() => {
        if (classId && date) {
            setLoadError(null);
            fetchAttendance(classId, date).catch(err => {
                setLoadError(err.message || 'Erro ao carregar dados da planilha.');
            });
        }
    }, [classId, date, fetchAttendance]);

    const currentClass = classes.find(c => c.name === classId);
    
    const handleStatusChange = async (student, nextStatus) => {
        const studentKey = `${student.ra}_${student.dig}`;
        
        // Prevent double saving the same student simultaneously
        if (savingIds.has(studentKey)) return;

        setSavingIds(prev => new Set(prev).add(studentKey));
        
        try {
            await toggleAttendance(classId, student.ra, student.dig, date, nextStatus);
            showToast(`Frequência de ${student.name} salva!`, 'success');
        } catch (error) {
            showToast(`Falha ao salvar chamada de ${student.name}`, 'error');
        } finally {
            setSavingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(studentKey);
                return newSet;
            });
        }
    };

    return (
        <div style={{ maxWidth: '650px', margin: '0 auto', paddingBottom: '100px', animation: 'fadeIn 0.3s ease-out' }}>
            <header className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', marginBottom: '2rem' }}>
                <Link to="/chamada" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
                    <ChevronLeft size={16} /> Voltar para Chamadas
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <div>
                        <h2 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {classId}
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Registre a presença dos alunos listados no Sheets</p>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="input"
                            style={{ 
                                paddingLeft: '38px', 
                                width: '165px', 
                                paddingTop: '8px', 
                                paddingBottom: '8px',
                                fontSize: '0.9rem',
                                borderRadius: '12px'
                            }}
                        />
                    </div>
                </div>
            </header>

            {/* Error State */}
            {loadError && (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid #fecaca', backgroundColor: '#fef2f2', borderRadius: 'var(--radius-lg)', color: '#991b1b', marginBottom: '20px' }}>
                    <AlertCircle size={36} style={{ margin: '0 auto 10px auto' }} />
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>Erro ao ler Planilha</h4>
                    <p style={{ fontSize: '0.88rem', lineHeight: 1.4, margin: '0 auto 1.5rem auto', maxWidth: '400px' }}>{loadError}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ backgroundColor: '#dc2626' }}>
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Loading Sheet Data */}
            {isLoading && !loadError && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Loader2 className="spin-animation" size={32} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Buscando alunos na aba da planilha...</p>
                    </div>
                </div>
            )}

            {/* Student List View */}
            {!isLoading && !loadError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {studentsList.length === 0 ? (
                        <div className="card text-center" style={{ padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: '0.95rem' }}>Nenhum aluno encontrado na aba correspondente a esta turma.</p>
                            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '6px' }}>Verifique se o nome da aba no Google Sheets coincide com a turma selecionada.</p>
                        </div>
                    ) : (
                        studentsList.map((student, index) => {
                            const isSaving = savingIds.has(`${student.ra}_${student.dig}`);
                            const currentStatus = student.status || "Presente";

                            return (
                                <div 
                                    key={`${student.ra}_${student.dig}_${index}`} 
                                    className="card" 
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '0.9rem 1.25rem',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                                        border: '1px solid var(--border-light)',
                                        backgroundColor: isSaving ? '#f8fafc' : 'white',
                                        transition: 'all 0.2s',
                                        opacity: isSaving ? 0.75 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', paddingRight: '8px' }}>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {student.name}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            RA: {student.ra}{student.dig ? `-${student.dig}` : ''}
                                        </span>
                                    </div>

                                    {/* Attendance Selector Button Group */}
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        {/* Presença (P) */}
                                        <button
                                            onClick={() => handleStatusChange(student, "Presente")}
                                            disabled={isSaving}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                fontSize: '0.9rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: currentStatus === "Presente" ? 'var(--color-success-bg, #ecfdf5)' : 'white',
                                                color: currentStatus === "Presente" ? 'var(--color-success, #10b981)' : '#94a3b8',
                                                borderColor: currentStatus === "Presente" ? 'rgba(16, 185, 129, 0.2)' : '#e2e8f0'
                                            }}
                                            title="Marcar Presente"
                                        >
                                            P
                                        </button>

                                        {/* Falta (F) */}
                                        <button
                                            onClick={() => handleStatusChange(student, "Falta")}
                                            disabled={isSaving}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                fontSize: '0.9rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: currentStatus === "Falta" ? 'var(--color-danger-bg, #fef2f2)' : 'white',
                                                color: currentStatus === "Falta" ? 'var(--color-danger, #ef4444)' : '#94a3b8',
                                                borderColor: currentStatus === "Falta" ? 'rgba(239, 68, 68, 0.2)' : '#e2e8f0'
                                            }}
                                            title="Marcar Falta"
                                        >
                                            F
                                        </button>

                                        {/* Atestado (A) */}
                                        <button
                                            onClick={() => handleStatusChange(student, "Atestado")}
                                            disabled={isSaving}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                fontSize: '0.9rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: currentStatus === "Atestado" ? 'var(--color-warning-bg, #fffbef)' : 'white',
                                                color: currentStatus === "Atestado" ? 'var(--color-warning, #f59e0b)' : '#94a3b8',
                                                borderColor: currentStatus === "Atestado" ? 'rgba(245, 158, 11, 0.2)' : '#e2e8f0'
                                            }}
                                            title="Marcar Atestado"
                                        >
                                            A
                                        </button>

                                        {/* Transferido (T) */}
                                        <button
                                            onClick={() => handleStatusChange(student, "Transferido")}
                                            disabled={isSaving}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                fontSize: '0.9rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: currentStatus === "Transferido" ? '#f1f5f9' : 'white',
                                                color: currentStatus === "Transferido" ? '#475569' : '#94a3b8',
                                                borderColor: currentStatus === "Transferido" ? '#cbd5e1' : '#e2e8f0'
                                            }}
                                            title="Marcar Transferido"
                                        >
                                            T
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
