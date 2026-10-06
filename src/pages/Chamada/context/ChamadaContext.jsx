import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useGlobalData } from '../../../app/providers/GlobalDataProvider';
import { getClassAttendanceData, saveClassAttendanceData } from '../../../services/attendanceService';
import { addToSyncQueue, getSyncQueue, removeFromQueue } from '../../../services/offlineSyncService';

const ChamadaContext = createContext(undefined);

export const ChamadaProvider = ({ children }) => {
    const { turmas, loadingData } = useGlobalData();
    const [classes, setClasses] = useState([]);
    const [classAttendance, setClassAttendance] = useState({}); // Key: `${className}_${date}`, Value: [{ ra, dig, name, status }]
    const [loadingAttendance, setLoadingAttendance] = useState({}); // Key: `${className}_${date}`, Value: boolean

    const loadingClasses = loadingData;

    // Processa a fila offline quando a internet voltar
    useEffect(() => {
        const handleOnline = async () => {
            const queue = getSyncQueue();
            if (queue.length > 0) {
                console.log("Conexão restaurada! Sincronizando chamadas offline...", queue.length);
                for (const item of queue) {
                    try {
                        await saveClassAttendanceData(item.sheetName, item.date, item.records);
                        removeFromQueue(item.sheetName, item.date);
                    } catch (err) {
                        console.error('Falha ao sincronizar item da fila offline no background:', err);
                    }
                }
            }
        };

        window.addEventListener('online', handleOnline);

        // Tenta processar assim que o app carregar, caso tenha algo na fila e esteja online
        if (navigator.onLine) {
            handleOnline();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, []);

    // Sync classes from the global provider (already sorted pedagogically)
    useEffect(() => {
        if (turmas) {
            const mappedClasses = turmas.map(t => ({
                id: String(t.id),
                name: t.nome
            }));
            setClasses(mappedClasses);
        }
    }, [turmas]);

    // 2. Carrega a lista de alunos e presenças da planilha Google Sheets
    const fetchAttendance = useCallback(async (className, date, forceRemote = false) => {
        const key = `${className}_${date}`;

        // Se já temos no estado, não faz nada
        if (classAttendance[key] && !forceRemote) return;

        // Tenta carregar do cache primeiro se não for forçado remotamente
        if (!forceRemote) {
            const cached = getCachedAttendance(className, date);
            if (cached) {
                setClassAttendance(prev => ({ ...prev, [key]: cached }));
                // Se temos cache, não precisamos mostrar carregando intenso no UI, mas podemos tentar atualizar em background
            }
        }

        setLoadingAttendance(prev => ({ ...prev, [key]: true }));
        try {
            const data = await getClassAttendanceData(className, date);
            if (data && data.students) {
                setClassAttendance(prev => ({
                    ...prev,
                    [key]: data.students
                }));
                // Atualiza o cache local
                cacheAttendance(className, date, data.students);

                // Se a coluna de data ainda não existir na planilha OU se não houver nenhuma marcação (coluna vazia),
                // inicializa em lote com "C" (Presente) para todos
                if ((data.dateColumnExists === false || data.hasMarkings === false) && data.students.length > 0) {
                    const defaultRecords = data.students.map(s => ({
                        ra: s.ra,
                        dig: s.dig,
                        status: "Presente"
                    }));
                    saveClassAttendanceData(className, date, defaultRecords).catch(err => {
                        console.error(`Erro ao inicializar chamada com padrão 'C' para ${className} em ${date}:`, err);
                    });
                }
            }
        } catch (error) {
            // Se falhou mas temos cache, a gente já carregou anteriormente. Se não, trata como erro.
            if (!classAttendance[key]) {
                console.error(`Erro ao carregar chamada de ${className} na data ${date}:`, error);
                throw error;
            }
        } finally {
            setLoadingAttendance(prev => ({ ...prev, [key]: false }));
        }
    }, [classAttendance]);

    // 3. Altera a presença de um aluno diretamente na planilha Google Sheets (salvamento automático)
    const toggleAttendance = async (className, studentRA, studentDIG, date, nextStatus) => {
        const key = `${className}_${date}`;
        const studentsList = classAttendance[key] || [];

        // Encontrar o aluno correspondente
        const studentIndex = studentsList.findIndex(s => s.ra === studentRA && s.dig === studentDIG);
        if (studentIndex === -1) return;

        const currentStatus = studentsList[studentIndex].status;

        // Atualização Otimista no Estado React (Atualização visual imediata)
        setClassAttendance(prev => {
            const updatedList = [...(prev[key] || [])];
            if (updatedList[studentIndex]) {
                updatedList[studentIndex] = {
                    ...updatedList[studentIndex],
                    status: nextStatus
                };
            }
            return {
                ...prev,
                [key]: updatedList
            };
        });

        try {
            if (!navigator.onLine) {
                throw new Error('OFFLINE_MODE');
            }
            // Envia gravação para a planilha do Google via Apps Script
            const updatedRecord = { ra: studentRA, dig: studentDIG, status: nextStatus };
            await saveClassAttendanceData(className, date, [updatedRecord]);
        } catch (error) {
            console.error("Erro ao gravar presença na planilha Google:", error);

            const isNetworkError = !navigator.onLine || error.message === 'OFFLINE_MODE' || error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('falha ao salvar');

            if (isNetworkError) {
                const updatedRecord = { ra: studentRA, dig: studentDIG, status: nextStatus };
                addToSyncQueue(className, date, [updatedRecord]);
                throw { offlineSaved: true, message: "Sem internet! Presença salva no aparelho (sincronizará depois)." };
            } else {
                // Em caso de erro de negócio, desfaz a atualização otimista (rollback)
                setClassAttendance(prev => {
                    const updatedList = [...(prev[key] || [])];
                    if (updatedList[studentIndex]) {
                        updatedList[studentIndex] = {
                            ...updatedList[studentIndex],
                            status: currentStatus
                        };
                    }
                    return {
                        ...prev,
                        [key]: updatedList
                    };
                });
                throw error; // Repassa o erro para o componente
            }
        }
    };

    // 4. Pré-carrega todas as turmas em background
    const preloadAllAttendance = useCallback(async (date) => {
        if (!classes || classes.length === 0) return;

        console.log("Iniciando pré-carregamento de todas as turmas...");
        // Carrega em paralelo (pode ajustar para limitar a concorrência se necessário)
        await Promise.allSettled(classes.map(cls => fetchAttendance(cls.name, date)));
        console.log("Pré-carregamento concluído.");
    }, [classes, fetchAttendance]);

    return (
        <ChamadaContext.Provider value={{
            classes,
            classAttendance,
            loadingClasses,
            loadingAttendance,
            fetchAttendance,
            toggleAttendance,
            preloadAllAttendance
        }}>
            {children}
        </ChamadaContext.Provider>
    );
};

export const useChamadaContext = () => {
    const context = useContext(ChamadaContext);
    if (context === undefined) {
        throw new Error('useChamadaContext deve ser usado dentro de um ChamadaProvider');
    }
    return context;
};
