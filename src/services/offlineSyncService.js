export const QUEUE_KEY = 'attendance_sync_queue';
export const CACHE_PREFIX = 'attendance_cache_';

export function getSyncQueue() {
  const q = localStorage.getItem(QUEUE_KEY);
  return q ? JSON.parse(q) : [];
}

export function addToSyncQueue(sheetName, date, records) {
  const queue = getSyncQueue();
  // Check if there's already an item for the same class and date
  const existingIndex = queue.findIndex(item => item.sheetName === sheetName && item.date === date);
  
  if (existingIndex >= 0) {
    // Merge records
    const existingRecords = queue[existingIndex].records;
    records.forEach(newRecord => {
      const recIndex = existingRecords.findIndex(r => r.ra === newRecord.ra && r.dig === newRecord.dig);
      if (recIndex >= 0) {
        existingRecords[recIndex].status = newRecord.status;
      } else {
        existingRecords.push(newRecord);
      }
    });
  } else {
    queue.push({ sheetName, date, records });
  }
  
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearSyncQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function removeFromQueue(sheetName, date) {
  let queue = getSyncQueue();
  queue = queue.filter(item => !(item.sheetName === sheetName && item.date === date));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function cacheAttendance(sheetName, date, students) {
  localStorage.setItem(`${CACHE_PREFIX}${sheetName}_${date}`, JSON.stringify(students));
}

export function getCachedAttendance(sheetName, date) {
  const data = localStorage.getItem(`${CACHE_PREFIX}${sheetName}_${date}`);
  return data ? JSON.parse(data) : null;
}
