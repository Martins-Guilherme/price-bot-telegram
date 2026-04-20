import { getCache, setCache } from "../../../utils/cache.js";

describe("Cache", () => {
  it("Deve salvar e recuperar valor do cache", () => {
    const key = "produto-teste";
    const value = [{ name: "notebook" }];

    setCache(key, value);

    const result = getCache(key);

    expect(result).toEqual(value);
  });

  it("Deve retornar null para chave inexistente", () => {
    const result = getCache("null");

    expect(result).toBeNull();
  });
});
