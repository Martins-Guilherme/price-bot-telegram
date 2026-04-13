const cache = new Map();

const TTL = 30 * 60 * 1000;
// 30 minutos

export function getCache(key) {
  const data = cache.get(key);

  if (!data) return null;

  if (Date.now() - data.timestamp > TTL) {
    cache.delete(key);
    return null;
  }

  return data.value;
}

export function setCache(key, value) {
  cache.set(key, {
    value,
    timestamp: Date.now(),
  });
}
