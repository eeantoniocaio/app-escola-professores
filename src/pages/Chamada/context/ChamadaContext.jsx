import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useGlobalData } from '../../../app/providers/GlobalDataProvider';
import { getClassAttendanceData, saveClassAttendanceData } from '../../../services/attendanceService';

const ChamadaContext = createContext(undefined);

export const ChamadaProvider = ({ children }) => {
    const { turmas, loadingData } = useGlobalData();
    const [classes, setClasses] = useState([]);
    const [classAttendance, setClassAttendance] = useState({}); // Key: `${className}_${date}`, Value: [{ ra, dig, name, status }]
    const [loadingAttendance, setLoadingAttendance] = useState({}); // Key: `${className}_${date}`, Value: boolean

    const loadingClasses = loadingData;

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
    const fetchAttendance = useCallback(async (className, date) => {
        const key = `${className}_${date}`;
        
        // Se já temos os dados no estado local, não precisa buscar novamente
        if (classAttendance[key]) return;

        setLoadingAttendance(prev => ({ ...prev, [key]: true }));
        try {
            const data = await getClassAttendanceData(className, date);
            if (data && data.students) {
                setClassAttendance(prev => ({
                    ...prev,
                    [key]: data.students
                }));

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
            console.error(`Erro ao carregar chamada de ${className} na data ${date}:`, error);
            throw error; // Re-throw para que o componente trate a mensagem de erro
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
            // Envia gravação para a planilha do Google via Apps Script
            const updatedRecord = { ra: studentRA, dig: studentDIG, status: nextStatus };
            await saveClassAttendanceData(className, date, [updatedRecord]);
        } catch (error) {
            console.error("Erro ao gravar presença na planilha Google:", error);
            
            // Em caso de erro, desfaz a atualização otimista (rollback)
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
            
            throw error; // Repassa o erro para o componente disparar o Toast
        }
    };

    return (
        <ChamadaContext.Provider value={{
            classes,
            classAttendance,
            loadingClasses,
            loadingAttendance,
            fetchAttendance,
            toggleAttendance
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
