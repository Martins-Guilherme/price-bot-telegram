import { expect, jest, it, describe, beforeEach } from "@jest/globals";
import { clearCache } from "../../../utils/cache.js";

const { getCache, setCache } = await import("../../../utils/cache.js");

describe("Cache", () => {
  beforeEach(() => {
    jest.useRealTimers();
    clearCache();
  });

  it("Deve salvar e recuperar valor do cache", () => {
    setCache("produto", [1, 2, 3]);
    expect(getCache("produto")).toEqual([1, 2, 3]);
  });

  it("Deve retornar null para chave inexistente", () => {
    expect(getCache("inexistente")).toBeNull();
  });

  it("Deve retornar erro ao sobrescrever valor existente", () => {
    setCache("x", 1);
    setCache("x", 2);
    expect(getCache("x")).toBe(2);
  });

  it("Deve expirar apos 30 minutos", () => {
    jest.useFakeTimers();

    const now = new Date("2026-01-01T10:00:00");
    jest.setSystemTime(now);

    jest.setSystemTime(new Date("2026-01-01T10:30:00"));
    expect(getCache("produto")).toBeNull();
  });

  it("Deve continuar valido antes do TTL", () => {
    jest.useFakeTimers();

    const now = new Date("2026-01-01TZ10:00:00");
    jest.setSystemTime(now);

    setCache("produto", ["Notebook"]);

    // Avançar 29 minutos
    jest.setSystemTime(new Date("2026-01-01TZ10:29:00"));

    expect(getCache("produto")).toEqual(["Notebook"]);
  });
});
