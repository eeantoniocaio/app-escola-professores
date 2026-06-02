import { supabase } from '../shared/services/supabase';
import { fetchClassAttendance, saveClassAttendance } from './googleSheetsService';

/**
 * Fetches the school classes (turmas) list from Supabase
 */
export async function getClasses() {
    const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('nome');

    if (error) {
        console.error("Erro ao buscar turmas no Supabase:", error);
        throw error;
    }

    return data.map(t => ({
        id: String(t.id),
        name: t.nome
    }));
}

/**
 * Loads student list and their attendance status for a class on a specific date
 */
export async function getClassAttendanceData(className, date) {
    return await fetchClassAttendance(className, date);
}

/**
 * Submits updated attendance records to the Google Sheets
 */
export async function saveClassAttendanceData(className, date, records) {
    return await saveClassAttendance(className, date, records);
}
