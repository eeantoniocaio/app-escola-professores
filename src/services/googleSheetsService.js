import { supabase } from '@/shared/services/supabase'

/**
 * Fetches the student list and attendance status for a given class and date.
 * @param {string} sheetName - Class name matching a sheet tab (e.g. "6º Ano A")
 * @param {string} date - Date in YYYY-MM-DD format
 */
export async function fetchClassAttendance(sheetName, date) {
  try {
    const { data, error } = await supabase.functions.invoke('sheets-proxy', {
      method: 'GET',
      queryParams: {
        action: 'getStudents',
        sheetName,
        date,
      },
    })

    if (error) {
      throw error
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'Erro desconhecido ao carregar presença.')
    }

    return data
  } catch (error) {
    console.error('Erro em fetchClassAttendance:', error)
    throw new Error(
      error.message || 'Falha ao conectar com o servidor da chamada via Edge Function. Verifique sua conexão.'
    )
  }
}

/**
 * Saves/Updates attendance records in batch for a given class and date.
 * @param {string} sheetName - Class name matching a sheet tab (e.g. "6º Ano A")
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array<{ra: string, dig: string, status: string}>} records - Array of updated student statuses
 */
export async function saveClassAttendance(sheetName, date, records) {
  try {
    const { data, error } = await supabase.functions.invoke('sheets-proxy', {
      method: 'POST',
      body: {
        action: 'saveAttendance',
        sheetName,
        date,
        records,
      },
    })

    if (error) {
      throw error
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'Erro desconhecido ao salvar presença.')
    }

    return data
  } catch (error) {
    console.error('Erro em saveClassAttendance:', error)
    throw new Error(
      error.message || 'Falha ao salvar a chamada no servidor via Edge Function. Verifique sua conexão.'
    )
  }
}
