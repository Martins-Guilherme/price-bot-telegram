const users = new Map();

const COLLDOW = 10000; // 10 segundos

export function canUse(userId) {
  const now = Date.now();
  const last = users.get(userId);

  if (last && now - last < COLLDOW) {
    return false;
  }
  users.set(userId, now);
  return true;
}
