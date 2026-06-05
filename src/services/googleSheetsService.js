import { ATTENDANCE_API_URL, ATTENDANCE_API_SECRET_TOKEN } from '@/shared/constants/env'

export const getApiUrl = () => {
  return ATTENDANCE_API_URL
}

/**
 * Helper to perform fetch requests with a timeout mechanism.
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 15000 } = options

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (err) {
    clearTimeout(id)
    if (err.name === 'AbortError') {
      throw new Error(
        'A requisição excedeu o tempo limite de 15 segundos. Por favor, tente novamente.'
      )
    }
    throw err
  }
}

/**
 * Fetches the student list and attendance status for a given class and date.
 * @param {string} sheetName - Class name matching a sheet tab (e.g. "6º Ano A")
 * @param {string} date - Date in YYYY-MM-DD format
 */
export async function fetchClassAttendance(sheetName, date) {
  const apiUrl = getApiUrl()
  if (!apiUrl) {
    throw new Error(
      'A URL da API do Google Apps Script não foi configurada. Configure a chave VITE_ATTENDANCE_API_URL no seu arquivo .env.'
    )
  }

  const token = ATTENDANCE_API_SECRET_TOKEN
  if (!token) {
    throw new Error(
      'O token de segurança da API não foi configurado. Configure a chave VITE_ATTENDANCE_API_SECRET_TOKEN no seu arquivo .env.'
    )
  }

  const url = `${apiUrl}?token=${token}&action=getStudents&sheetName=${encodeURIComponent(
    sheetName
  )}&date=${date}`

  try {
    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      throw new Error(`Erro na comunicação com a API: status ${response.status} (${response.statusText})`)
    }

    const data = await response.json()
    if (data.status === 'error') {
      throw new Error(data.message || 'Erro desconhecido ao carregar presença.')
    }

    return data
  } catch (error) {
    console.error('Erro em fetchClassAttendance:', error)
    throw new Error(error.message || 'Falha ao conectar com o servidor da chamada. Verifique sua conexão.')
  }
}

/**
 * Saves/Updates attendance records in batch for a given class and date.
 * @param {string} sheetName - Class name matching a sheet tab (e.g. "6º Ano A")
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array<{ra: string, dig: string, status: string}>} records - Array of updated student statuses
 */
export async function saveClassAttendance(sheetName, date, records) {
  const apiUrl = getApiUrl()
  if (!apiUrl) {
    throw new Error(
      'A URL da API do Google Apps Script não foi configurada. Configure a chave VITE_ATTENDANCE_API_URL no seu arquivo .env.'
    )
  }

  const token = ATTENDANCE_API_SECRET_TOKEN
  if (!token) {
    throw new Error(
      'O token de segurança da API não foi configurado. Configure a chave VITE_ATTENDANCE_API_SECRET_TOKEN no seu arquivo .env.'
    )
  }

  const payload = {
    token: token,
    action: 'saveAttendance',
    sheetName,
    date,
    records,
  }

  try {
    const response = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      mode: 'no-cors', // Crucial for Google Apps Script redirects when calling POST from frontend
      headers: {
        'Content-Type': 'text/plain', // Prevents CORS preflight requests which GAS does not support
      },
      body: JSON.stringify(payload),
    })

    // Note: with "no-cors", response.ok will be false and response.status will be 0.
    // However, the request is successfully dispatched and executed on Google Sheets.
    // We return a simulated success. If any network failure, fetch will throw.
    return { status: 'success', message: 'Comando de gravação enviado com sucesso!' }
  } catch (error) {
    console.error('Erro em saveClassAttendance:', error)
    throw new Error(error.message || 'Falha ao salvar a chamada no servidor. Verifique sua conexão.')
  }
}
