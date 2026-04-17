const users = new Map();
const COLLDOW = 10000; // 10 segundos

import {
  BotRatLimitIsNotNumberError,
  BotRateLimitException,
} from "../errors/index.js";

export function canUse(userId) {
  if (typeof userId !== "number") {
    throw new BotRatLimitIsNotNumberError(
      "Usuário atingiu o limite de buscas por minuto.",
    );
  }
  const now = Date.now();
  const last = users.get(userId);

  if (last && now - last < COLLDOW) {
    throw new BotRateLimitException(
      "Usuário atingiu o limite de buscas.",
    );
  }
  users.set(userId, now);
  return true;
}
