const users = new Map();
export function clearRateLimit() {
  users.clear();
}
const COLLDOW = 10000; // 10 segundos

import {
  BotRatLimitIsNotNumberError,
  BotRateLimitException,
} from "../errors/index.js";

export function canUse(userId) {
  if (typeof userId !== "number") {
    throw new BotRatLimitIsNotNumberError("O userId deve ser um número.");
  }
  const now = Date.now();
  const last = users.get(userId);

  if (last && now - last < COLLDOW) {
    throw new BotRateLimitException("Usuário atingiu o limite de buscas.");
  }
  users.set(userId, now);
  return true;
}
