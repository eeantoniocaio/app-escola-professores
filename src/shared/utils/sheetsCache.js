const activeRequests = new Map(); // key -> Promise
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de TTL

/**
 * Recupera um valor do sessionStorage se ainda estiver dentro do TTL.
 */
export function getCachedData(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Grava um valor no sessionStorage com o timestamp atual.
 */
export function setCachedData(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Trata falha caso o storage esteja cheio
  }
}

/**
 * Remove chaves do sessionStorage que começam com um prefixo.
 */
export function clearCacheWithPrefix(prefix) {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (e) {
    // ignore
  }
}

/**
 * Executa uma função de busca com deduplicação de requisições concorrentes.
 * Se já houver uma requisição em andamento para a mesma chave, retorna a promessa existente.
 */
export function getOrFetch(key, fetchFn) {
  if (activeRequests.has(key)) {
    return activeRequests.get(key);
  }

  const promise = fetchFn()
    .then(data => {
      activeRequests.delete(key);
      return data;
    })
    .catch(err => {
      activeRequests.delete(key);
      throw err;
    });

  activeRequests.set(key, promise);
  return promise;
}
