export const QUEUE_KEY = 'attendance_sync_queue';
export const CACHE_PREFIX = 'attendance_cache_';
// [ ... existing functions ... ]
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
