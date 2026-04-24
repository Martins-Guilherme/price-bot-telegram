import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

await jest.unstable_mockModule("../../../services/priceService.js", () => ({
  savePrices: jest.fn(),
}));
await jest.unstable_mockModule("../../../scrapers/index.js", () => ({
  getAllScrapers: jest.fn(),
}));
await jest.unstable_mockModule("../../../utils/cache.js", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
}));
await jest.unstable_mockModule("../../../utils/rateLimit.js", () => ({
  canUse: jest.fn(),
}));
await jest.unstable_mockModule("../../../utils/queue.js", () => ({
  scraperQueue: { add: jest.fn((fn) => fn()) },
  withTimeout: jest.fn((promise) => promise),
}));

const { createFakeProduct } = await import("../components.js");
const { createBotMock } = await import("../mocks/botMock.js");

const {
  verifyRawNameProduct,
  findScraperAndSearch,
  processResults,
  enviarMensagemDeErro,
} = await import("../../../bot/botService.js");
const { savePrices } = await import("../../../services/priceService.js");
const { getAllScrapers } = await import("../../../scrapers/index.js");
const { getCache, setCache } = await import("../../../utils/cache.js");
const { canUse } = await import("../../../utils/rateLimit.js");
const { scraperQueue, withTimeout } = await import("../../../utils/queue.js");
const { BotRateLimitException } = await import("../../../errors/index.js");

const chatIdFake = 12345;

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

describe("botService - verifyRawNameProduct", () => {
  let bot;

  beforeEach(() => {
    bot = createBotMock();
    jest.clearAllMocks();
    canUse.mockResolvedValue(true);
    getCache.mockResolvedValue(null);
    savePrices.mockResolvedValue(undefined);
    setCache.mockResolvedValue(undefined);
    scraperQueue.add.mockImplementation(async (fn) => fn());
    withTimeout.mockImplementation(async (promise) => promise);
  });

  it("retorna erro de validação quando rawProduct é indefinido", async () => {
    await verifyRawNameProduct(chatIdFake, bot, undefined);

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining(
        "❌ Erro de validação de nome, tente novamente mais tarde",
      ),
    );
    expect(canUse).not.toHaveBeenCalled();
    expect(getAllScrapers).not.toHaveBeenCalled();
  });

  it("retorna erro de validação quando rawProduct está vazio", async () => {
    await verifyRawNameProduct(chatIdFake, bot, "   ");

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining("❌ Não aceita buscas vazias."),
    );
    expect(canUse).not.toHaveBeenCalled();
  });

  it("retorna erro de validação quando rawProduct contém caracteres inválidos", async () => {
    await verifyRawNameProduct(chatIdFake, bot, "@*&$!#@");

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining("❌ Informe um produto válido."),
    );
    expect(canUse).not.toHaveBeenCalled();
  });

  it("retorna erro de validação quando chatId não é um número", async () => {
    await verifyRawNameProduct("invalid-id", bot, "notebook");

    expect(bot.sendMessage).toHaveBeenCalledWith(
      "invalid-id",
      expect.stringContaining(
        "❌ Erro de validação interno, tente novamente mais tarde.",
      ),
    );
    expect(canUse).not.toHaveBeenCalled();
  });

  it("usa cache e não chama scrapers quando existem resultados recentes", async () => {
    const cachedResult = createFakeProduct({
      title: "Cache notebook",
      image: undefined,
    });
    getCache.mockResolvedValue([cachedResult]);

    await verifyRawNameProduct(chatIdFake, bot, "Notebook");

    expect(getAllScrapers).not.toHaveBeenCalled();
    expect(savePrices).not.toHaveBeenCalled();
    expect(bot.sendMessage).toHaveBeenNthCalledWith(
      1,
      chatIdFake,
      "⚡ Resultados recentes encontrados:",
    );
    expect(bot.sendMessage).toHaveBeenLastCalledWith(
      chatIdFake,
      expect.stringContaining("✨ *Oferta encontrada*"),
      expect.any(Object),
    );
  });

  it("pesquisa scrapers e salva os resultados quando o cache está vazio", async () => {
    const scraperResult = createFakeProduct({
      title: "Produto A",
      price: 100,
      image: undefined,
      source: "amazon",
    });
    getAllScrapers.mockReturnValue([
      { search: jest.fn().mockResolvedValue([scraperResult]) },
    ]);

    await verifyRawNameProduct(chatIdFake, bot, "notebook");

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      "🔎 Buscando 'notebook'...",
    );
    expect(getAllScrapers).toHaveBeenCalled();
    expect(savePrices).toHaveBeenCalledWith(
      expect.objectContaining({
        product: "notebook",
        prices: expect.any(Array),
      }),
    );
    expect(bot.sendMessage).toHaveBeenLastCalledWith(
      chatIdFake,
      expect.stringContaining("✨ *Oferta encontrada*"),
      expect.any(Object),
    );
  });

  it("retorna um erro quando os scrapers não retornam resultados", async () => {
    getAllScrapers.mockReturnValue([
      { search: jest.fn().mockResolvedValue([]) },
    ]);

    await verifyRawNameProduct(chatIdFake, bot, "notebook");

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining("❌ Erro ao processar resultados."),
    );
  });

  it("retorna uma mensagem de limite de taxa quando canUse rejeita", async () => {
    canUse.mockRejectedValue(new BotRateLimitException());

    await verifyRawNameProduct(chatIdFake, bot, "notebook");

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining("⏳ Aguarde 10 segundos..."),
    );
    expect(getAllScrapers).not.toHaveBeenCalled();
  });
});

describe("botService - findScraperAndSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    scraperQueue.add.mockImplementation(async (fn) => fn());
    withTimeout.mockImplementation(async (promise) => promise);
  });

  it("combina resultados de vários scrapers e ignora scrapers com falha", async () => {
    const validProduct = createFakeProduct({
      title: "Produto Bom",
      price: 50,
      image: undefined,
      source: "amazon",
    });
    const badScraper = {
      search: jest.fn().mockRejectedValue(new Error("timeout")),
    };
    const invalidScraper = {
      search: jest.fn().mockResolvedValue([null, { foo: "bar" }]),
    };

    getAllScrapers.mockReturnValue([
      { search: jest.fn().mockResolvedValue([validProduct]) },
      badScraper,
      null,
      invalidScraper,
    ]);

    const result = await findScraperAndSearch("notebook");

    expect(result).toEqual([validProduct]);
    expect(scraperQueue.add).toHaveBeenCalledTimes(4);
    expect(withTimeout).toHaveBeenCalled();
  });

  it("retorna um array vazio quando nenhum scraper está registrado", async () => {
    getAllScrapers.mockReturnValue([]);

    const result = await findScraperAndSearch("notebook");

    expect(result).toEqual([]);
    expect(scraperQueue.add).not.toHaveBeenCalled();
  });
});

describe("botService - processResults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savePrices.mockResolvedValue(undefined);
    setCache.mockResolvedValue(undefined);
  });

  it("classifica por preço, limita aos 5 primeiros e persiste os resultados", async () => {
    const results = [
      createFakeProduct({ title: "Produto 1", price: 200 }),
      createFakeProduct({ title: "Produto 2", price: 50 }),
      createFakeProduct({ title: "Produto 3", price: 10 }),
      createFakeProduct({ title: "Produto 4", price: 80 }),
      createFakeProduct({ title: "Produto 5", price: 20 }),
      createFakeProduct({ title: "Produto 6", price: 5 }),
    ];

    const response = await processResults("notebook", results);

    expect(response).toHaveLength(5);
    expect(response[0].price).toBe(5);
    expect(response[response.length - 1].price).toBe(80);
    expect(savePrices).toHaveBeenCalledWith({
      product: "notebook",
      prices: expect.arrayContaining(response),
    });
    expect(setCache).toHaveBeenCalledWith("notebook", response);
  });
});

describe("botService - enviarMensagemDeErro", () => {
  let bot;

  beforeEach(() => {
    bot = createBotMock();
  });

  it("envia uma mensagem de limite de taxa quando ocorre BotRateLimitException", async () => {
    await enviarMensagemDeErro({
      bot,
      chatId: chatIdFake,
      err: new BotRateLimitException(),
    });

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      "⏳ Aguarde 10 segundos...",
    );
  });

  it("envia uma mensagem gênerica quando ocorre um erro inesperado", async () => {
    await enviarMensagemDeErro({
      bot,
      chatId: chatIdFake,
      err: new Error("boom"),
    });

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      "⚠️ Ocorreu um erro inesperado.",
    );
  });
});
