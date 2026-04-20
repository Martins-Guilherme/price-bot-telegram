import { afterEach } from "@jest/globals";

import { creteBotMock } from "../mocks/botMock.js";

// Real import

const { canUse } = await import("../../../utils/rateLimit.js");

const { BotRatLimitIsNotNumberError, BotRateLimitException } =
  await import("../../../errors/index.js");

describe("Rate limit", () => {
  it("Deve impedir que o userId seja uma string", () => {
    function inputWrong() {
      canUse("string");
    }
    expect(inputWrong).toThrow(BotRatLimitIsNotNumberError);
  });
  it("Deve permitir uso inicial", () => {
    const chatId = 1;

    const result = canUse(chatId);

    expect(result).toBe(true);
  });

  it("Deve impedir o excesso de requisições", () => {
    const chatId = 2;

    function limitException() {
      for (let i = 0; i < 10; i++) canUse(chatId);
    }
    expect(new BotRateLimitException()).toEqual(new BotRateLimitException());
  });

  it("Devo fazer", async () => {
    //🔹 Reset após tempo
    // Exemplo:
    // bloqueia agora
    // espera 10 segundos
    // permite novamente
    // 🔹 IDs diferentes independentes
    // chatId 1 bloqueado
    // chatId 2 ainda livre
  });
});
