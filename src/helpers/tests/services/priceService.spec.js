import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

await jest.unstable_mockModule("../../../db/database.js", () => ({
  default: {
    prepare: jest.fn().mockReturnValue({ run: jest.fn() }),
    transaction: jest.fn((fn) => fn),
  },
}));

const { savePrices } = await import("../../../services/priceService.js");
const db = await import("../../../db/database.js");

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

describe("priceService - savePrices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prepara a query de preços e insere apenas produtos válidos", async () => {
    const prices = [
      {
        title: "Produto A",
        price: "100",
        source: "amazon",
        image: "http://img.com/1",
        link: "http://buy.com/1",
      },
      {
        title: "Produto B",
        price: 0,
        source: "kabum",
        image: "http://img.com/2",
        link: "http://buy.com/2",
      },
      {
        title: "Produto C",
        price: "invalid",
        source: "ml",
        image: "http://img.com/3",
        link: "http://buy.com/3",
      },
      {
        title: "Produto D",
        price: 50.5,
        source: "amazon",
        image: null,
        link: null,
      },
    ];

    await savePrices({ product: "notebook", prices });

    expect(db.default.prepare).toHaveBeenCalledTimes(1);
    expect(db.default.transaction).toHaveBeenCalledTimes(1);

    const runMock = db.default.prepare().run;
    expect(runMock).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledWith(
      "notebook",
      "Produto A",
      100,
      "amazon",
      "http://img.com/1",
      "http://buy.com/1",
    );
    expect(runMock).toHaveBeenCalledWith(
      "notebook",
      "Produto D",
      50.5,
      "amazon",
      null,
      null,
    );
  });

  it("usa valores padrão para source, image e link quando estiverem ausentes", async () => {
    const prices = [{ title: "Produto default", price: "20" }];

    await savePrices({ product: "fone", prices });

    const runMock = db.default.prepare().run;
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "fone",
      "Produto default",
      20,
      "unknown",
      null,
      null,
    );
  });

  it("não insere nenhuma linha quando todos os preços são inválidos", async () => {
    const prices = [
      { title: "Produto vazio", price: null },
      { title: "Produto texto", price: "abc" },
      { title: "Produto zero", price: 0 },
    ];

    await savePrices({ product: "tablet", prices });

    expect(db.default.prepare).toHaveBeenCalledTimes(1);
    expect(db.default.transaction).toHaveBeenCalledTimes(1);
    expect(db.default.prepare().run).not.toHaveBeenCalled();
  });
});
