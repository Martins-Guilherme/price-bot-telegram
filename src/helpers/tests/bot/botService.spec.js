// Diferença entre os módulos:
// unstable_mockModule por conta que estou utilizando EcmaScript Modules(ESM)
// jest.mock para utilizar com módulos CommonJs

//**//**/**//*///*/**//*/*/*/*/* */ */ */ */

// Tipo de import                                   Como importar

// Módulos mockados e seus dependentes          await import()  dinâmico

// Módulos não mockados                         (errors, helpers)import estático normal

import { jest } from "@jest/globals";

// ─── Mocks ————

await jest.unstable_mockModule("../../../services/priceService.js", () => ({
  savePrices: jest.fn(),
}));
await jest.unstable_mockModule("../../../scrapers/index.js", () => ({
  getAllScrapers: jest.fn(),
  getScraper: jest.fn(),
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
await jest.unstable_mockModule("../../../db/database.js", () => ({
  default: {
    prepare: jest.fn().mockReturnValue({
      run: jest.fn().mockReturnValue({ changes: 1 }),
      get: jest.fn().mockReturnValue(null),
      all: jest.fn().mockReturnValue([]),
    }),
  },
}));

// Imports do código real

const {
  verifyRawNameProduct,
  findScraperAndSearch,
  processResults,
  enviarMensagemDeErro,
} = await import("../../../bot/botService.js");

const { savePrices } = await import("../../../services/priceService.js");
const { getAllScrapers, getScraper } =
  await import("../../../scrapers/index.js");
const { getCache, setCache } = await import("../../../utils/cache.js");
const { canUse } = await import("../../../utils/rateLimit.js");
const { scraperQueue } = await import("../../../utils/queue.js");

import {
  MercadoLivreScraperError,
  KabumScraperError,
  AmazonScraperError,
  BotInvalidProductDataException,
  BotNotProductFoundException,
  BotProductNotArrayException,
  BotRatLimitIsNotNumberError,
  BotRateLimitException,
  BotValidationNameError,
} from "../../../errors/index.js";

// Mock do bot

import { creteBotMock } from "../mocks/botMock.js";

//  Helper's

const makeProducts = ({ overrides = {} }) => ({
  title: "Produto teste",
  price: 9.99,
  link: "https://loja.com/produto",
  image: "https://imagem.com/image.jpeg",
  source: "amazon",
  ...overrides,
});

const chatIdFake = 12345;

//  VERIFYRAWNAMEPRODUCTS

describe("verifyRawNameProduct", () => {
  let bot;

  beforeEach(() => {
    bot = creteBotMock();
    jest.clearAllMocks();
    canUse.mockReturnValue(true);
    getCache.mockResolvedValue(null);
    savePrices.mockResolvedValue(undefined);
    //jest.spyOn(console, "error").mockImplementation(() => {}); // silenciar os console's
    jest.spyOn(console, "warn").mockImplementation(() => {}); // silenciar os console's
  });
  const rawProductsFake = "";

  //  Validação do nome

  // POR PADRÃO, FOI USADO REGEX PARA EVITAR (FALSY) E RETIRANDO ESPAÇOS EM BRANCO DESNECESSARIOS.
  it("deve envia erro quando rawProduct é vazio", async () => {
    await verifyRawNameProduct(chatIdFake, bot, "");
    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining(""),
    );
  });

  it("deve envia erro quando o rawProduct é undefined", async () => {
    await verifyRawNameProduct(chatIdFake, bot, undefined);

    // VERIFICAR LÓGICA DO CÓDIGO REAL, ERRO SAINDO NO CONSOLE, NO PROXIMO TESTE TAMBEM
    //  CRIAR REGRA DE NEGOCIO PARA CADA ERRO
    // console.error
    // Erro de validação do nome do produto:: BotValidationNameError - Não aceita buscas com caracteres especiais.
    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining(
        "❌ Informe um produto válido.\nEx: /buscar notebook",
      ),
    );
  });

  it("deve enviar erro quando rawProduct contém caracteres especias", async () => {
    await verifyRawNameProduct(chatIdFake, bot, "@*&$!#@");

    expect(bot.sendMessage).toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining(
        "❌ Informe um produto válido.\nEx: /buscar notebook",
      ),
    );
  });

  it("deve aceita nomes com letras, números, espaços e hífens", async () => {
    await getAllScrapers.mockReturnValue([]);
    await verifyRawNameProduct(bot, chatIdFake, "Body Splash Radiant-2");

    expect(bot.sendMessage).not.toHaveBeenCalledWith(
      chatIdFake,
      expect("Produto válido"),
    );
  });

  it("deve aceitar acentos no nome do produto", async () => {
    await getAllScrapers.mockReturnValue([]);
    await verifyRawNameProduct(
      bot,
      chatIdFake,
      "café Arnoma especial bubble-duck",
    );

    expect(bot.sendMessage).not.toHaveBeenCalledWith(
      chatIdFake,
      expect.stringContaining("Produto valido"),
    );
  });
});
