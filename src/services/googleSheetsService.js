const SECRET_TOKEN = "antonio-caio-frequencia-token-2026"; // Must match the SECRET_TOKEN in Google Apps Script

export const getApiUrl = () => {
    return import.meta.env.VITE_ATTENDANCE_API_URL || '';
};

/**
 * Fetches the student list and attendance status for a given class and date.
 * @param {string} sheetName - Class name matching a sheet tab (e.g. "6º Ano A")
 * @param {string} date - Date in YYYY-MM-DD format
 */
export async function fetchClassAttendance(sheetName, date) {
    const apiUrl = getApiUrl();
    if (!apiUrl || apiUrl.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT") || apiUrl === "") {
        throw new Error("A URL da API do Google Apps Script não foi configurada. Por favor, implante o script e configure a chave VITE_ATTENDANCE_API_URL no seu arquivo .env com a URL de implantação do Apps Script.");
    }

    const url = `${apiUrl}?token=${SECRET_TOKEN}&action=getStudents&sheetName=${encodeURIComponent(sheetName)}&date=${date}`;
    
    // Apps Script requires redirect handling (fetch does this automatically)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erro na comunicação com a API: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === "error") {
        throw new Error(data.message || "Erro desconhecido ao carregar presença.");
    }

    return data; // Expected shape: { status: "success", students: [{ ra, dig, name, status }], dateColumnExists }
}

/**
 * Saves/Updates attendance records in batch for a given class and date.
 * @param {string} sheetName - Class name matching a sheet tab (e.g. "6º Ano A")
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array<{ra: string, dig: string, status: string}>} records - Array of updated student statuses
 */
export async function saveClassAttendance(sheetName, date, records) {
    const apiUrl = getApiUrl();
    if (!apiUrl || apiUrl.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT") || apiUrl === "") {
        throw new Error("A URL da API do Google Apps Script não foi configurada. Por favor, implante o script e configure a chave VITE_ATTENDANCE_API_URL no seu arquivo .env com a URL de implantação do Apps Script.");
    }

    const payload = {
        token: SECRET_TOKEN,
        action: "saveAttendance",
        sheetName,
        date,
        records
    };

    const response = await fetch(apiUrl, {
        method: "POST",
        mode: "no-cors", // Crucial for Google Apps Script redirects when calling POST from frontend
        headers: {
            "Content-Type": "text/plain" // Prevents CORS preflight requests which GAS does not support
        },
        body: JSON.stringify(payload)
    });

    // Note: with "no-cors", response.ok will be false and response.status will be 0.
    // However, the request is successfully dispatched and executed on Google Sheets.
    // We return a simulated success. If any network failure, fetch will throw.
    return { status: "success", message: "Comando de gravação enviado com sucesso!" };
}
