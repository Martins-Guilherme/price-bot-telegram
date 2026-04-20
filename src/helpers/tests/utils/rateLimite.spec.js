import {
  afterEach,
  it,
  describe,
  expect,
  jest,
  beforeEach,
} from "@jest/globals";
import { clearRateLimit } from "../../../utils/rateLimit.js";

// Real import

const { canUse } = await import("../../../utils/rateLimit.js");

const { BotRatLimitIsNotNumberError, BotRateLimitException } =
  await import("../../../errors/index.js");

describe("Rate limit", () => {
  beforeEach(() => {
    clearRateLimit();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T10:00:00"));
  });

  it("Deve impedir que o userId seja uma string", () => {
    expect(() => canUse("string")).toThrow(BotRatLimitIsNotNumberError);
  });
  it("Deve permitir uso inicial", () => {
    expect(canUse(1)).toBe(true);
  });

  it("Deve impedir o excesso de requisições", () => {
    canUse(2);
    expect(() => canUse(2)).toThrow(BotRateLimitException);
  });

  it("Deve liberar apos 10 segundos", async () => {
    canUse(3);
    jest.advanceTimersByTime(10001);
    expect(canUse(3)).toBe(true);
  });

  it("Deve tratar usuarios diferentes de forma independente", () => {
    canUse(10);
    expect(() => canUse(10)).toThrow(BotRateLimitException);

    expect(canUse(20)).toBe(true);
  });
});
