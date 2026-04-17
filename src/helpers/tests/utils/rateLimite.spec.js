import { canUse } from "../../../utils/rateLimit.js";
import {
  BotRatLimitIsNotNumberError,
  BotRateLimitException,
} from "../../../errors/index.js";

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
    expect(limitException).toThrow(BotRateLimitException);
  });
});
