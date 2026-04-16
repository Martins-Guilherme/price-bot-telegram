const users = new Map();
const COLLDOW = 10000; // 10 segundos

import { BotRatLimitIsNotNumberError } from "../errors/index.js";

export function canUse(userId) {
  const now = Date.now();
  if (typeof userId !== "number") {
    throw new BotRatLimitIsNotNumberError(
      "userId deve ser um número",
      typeof userId,
      " (",
      userId,
      ")",
    );
  }
  const last = users.get(userId);

  if (last && now - last < COLLDOW) {
    return false;
  }
  users.set(userId, now);
  return true;
}
