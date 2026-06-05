import React, { useState } from 'react';
import { useChamadaContext } from '../../pages/Chamada/context/ChamadaContext';
import { fetchClassAttendance } from '../../services/googleSheetsService';
import { X, Download } from 'lucide-react';
import { useToast } from '../../app/providers/ToastProvider';
import logger from '../../shared/utils/logger';

const ReportModal = ({ isOpen, onClose }) => {
    const { classes } = useChamadaContext();
    const { showToast } = useToast();

    // States
    const [selectedClassIds, setSelectedClassIds] = useState(new Set());
    const [dateMode, setDateMode] = useState('single');
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [onlyAbsences, setOnlyAbsences] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleToggleClass = (id) => {
        const newSet = new Set(selectedClassIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedClassIds(newSet);
    };

    const handleSelectAllClasses = () => {
        if (selectedClassIds.size === classes.length) {
            setSelectedClassIds(new Set());
        } else {
            setSelectedClassIds(new Set(classes.map(c => c.id)));
        }
    };

    const handleGenerateReport = async () => {
        if (selectedClassIds.size === 0) {
            showToast('Selecione pelo menos uma turma.', 'warning');
            return;
        }

        setIsGenerating(true);
        showToast('Buscando dados no Google Sheets...', 'info');

        try {
            const targetClassNames = Array.from(selectedClassIds)
                .map(id => classes.find(c => c.id === id)?.name)
                .filter(Boolean);

            // Generate dates list
            const datesList = [];
            if (dateMode === 'single') {
                datesList.push(startDate);
            } else {
                let curr = new Date(startDate + 'T12:00:00');
                const end = new Date(endDate + 'T12:00:00');
                
                if (curr > end) {
                    showToast('A data de início não pode ser maior que a data de término.', 'warning');
                    setIsGenerating(false);
                    return;
                }

                while (curr <= end) {
                    datesList.push(curr.toISOString().split('T')[0]);
                    curr.setDate(curr.getDate() + 1);
                }
            }

            const allFetchedRecords = [];
            
            // Fetch in batches sequentially to prevent overloading GAS
            for (const className of targetClassNames) {
                for (const dateVal of datesList) {
                    try {
                        const res = await fetchClassAttendance(className, dateVal);
                        if (res && res.students) {
                            allFetchedRecords.push({
                                className,
                                date: dateVal,
                                students: res.students
                            });
                        }
                    } catch (err) {
                        logger.warn(`[Relatório] Não foi possível ler chamada de ${className} em ${dateVal}. Purgando da exportação.`, err);
                    }
                }
            }

            if (allFetchedRecords.length === 0) {
                showToast('Nenhum dado de frequência encontrado no Google Sheets para as turmas e datas selecionadas.', 'warning');
                setIsGenerating(false);
                return;
            }

            let csvContent = "Data,Turma,RA,Nome do Aluno,Status,Total Faltas Periodo\n";
            let hasData = false;

            // Pre-calculate total absences per student in the selected period
            const studentAbsencesCount = {};
            allFetchedRecords.forEach(record => {
                record.students.forEach(student => {
                    const key = `${student.ra}_${student.dig}`;
                    if (student.status === "Falta") {
                        studentAbsencesCount[key] = (studentAbsencesCount[key] || 0) + 1;
                    }
                });
            });

            // Sort records: date desc, then class name asc
            allFetchedRecords.sort((a, b) => {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateDiff !== 0) return dateDiff;
                return a.className.localeCompare(b.className);
            });

            allFetchedRecords.forEach(record => {
                const [year, month, day] = record.date.split('-');
                const recordDate = `${day}/${month}/${year}`;

                record.students.forEach(student => {
                    const isPresent = student.status === "Presente";
                    
                    if (onlyAbsences && isPresent) return; // Skip present students if filtering absences

                    const key = `${student.ra}_${student.dig}`;
                    const statusLabel = student.status;
                    const totalAbsences = studentAbsencesCount[key] || 0;
                    const raDisplay = student.dig ? `${student.ra}-${student.dig}` : student.ra;

                    csvContent += `${recordDate},"${record.className}","${raDisplay}","${student.name}",${statusLabel},${totalAbsences}\n`;
                    hasData = true;
                });
            });

            if (!hasData) {
                showToast(onlyAbsences
                    ? 'Nenhuma falta encontrada para os filtros selecionados.'
                    : 'Nenhum registro de presença encontrado para os filtros selecionados.', 'info');
                setIsGenerating(false);
                return;
            }

            // CSV Download trigger (adding BOM for Excel UTF-8 compatibility)
            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `relatorio_frequencia_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Relatório baixado com sucesso!');
            setIsGenerating(false);
            onClose();
        } catch (error) {
            logger.error('Erro ao gerar relatório:', error);
            showToast('Erro ao gerar relatório de planilha. Verifique a API.', 'error');
            setIsGenerating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Gerar Relatório de Planilha</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '20px' }}>

                    {/* Período */}
                    <div style={{ marginBottom: '24px' }}>
                        <label className="label" style={{ marginBottom: '10px', display: 'block' }}>Período</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button
                                className="btn"
                                onClick={() => setDateMode('single')}
                                style={{
                                    flex: 1,
                                    backgroundColor: dateMode === 'single' ? 'var(--color-primary)' : '#f1f5f9',
                                    color: dateMode === 'single' ? 'white' : '#64748b',
                                    fontWeight: 600
                                }}
                            >
                                Data Única
                            </button>
                            <button
                                className="btn"
                                onClick={() => setDateMode('period')}
                                style={{
                                    flex: 1,
                                    backgroundColor: dateMode === 'period' ? 'var(--color-primary)' : '#f1f5f9',
                                    color: dateMode === 'period' ? 'white' : '#64748b',
                                    fontWeight: 600
                                }}
                            >
                                Período
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="date"
                                    className="input"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    style={{ padding: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            {dateMode === 'period' && (
                                <>
                                    <span style={{ color: '#94a3b8' }}>até</span>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="date"
                                            className="input"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            style={{ padding: '10px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Seleção de Turmas */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label className="label" style={{ margin: 0 }}>Turmas</label>
                            <button
                                onClick={handleSelectAllClasses}
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                                {selectedClassIds.size === classes.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                            </button>
                        </div>

                        <div style={{
                            maxHeight: '180px',
                            overflowY: 'auto',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            {classes.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '8px', textAlign: 'center' }}>Nenhuma turma cadastrada.</p>}
                            {classes.map(cls => (
                                <div key={cls.id} style={{ padding: '6px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}>
                                    <input
                                        type="checkbox"
                                        id={`cls-${cls.id}`}
                                        checked={selectedClassIds.has(cls.id)}
                                        onChange={() => handleToggleClass(cls.id)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor={`cls-${cls.id}`} style={{ cursor: 'pointer', fontSize: '0.9rem', flex: 1, color: 'var(--text-main)' }}>{cls.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filtro de Opção */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                id="onlyAbsences"
                                checked={onlyAbsences}
                                onChange={e => setOnlyAbsences(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="onlyAbsences" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>Exportar apenas alunos com faltas</label>
                        </div>
                    </div>

                    {/* Botão de download */}
                    <button
                        onClick={handleGenerateReport}
                        className="btn btn-primary"
                        disabled={isGenerating}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                            opacity: isGenerating ? 0.7 : 1
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderLeftColor: 'white' }}></div>
                                Buscando no Sheets...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Baixar Relatório CSV
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default ReportModal;
