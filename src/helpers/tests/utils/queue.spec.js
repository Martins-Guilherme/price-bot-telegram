import { withTimeout } from "../../../utils/queue.js";

describe("Queue / Timeout", () => {
  it("Deve resolver quando a promise é rápida", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 1000);

    expect(result).toBe("ok");
  });

  it("Deve rejeitar quando a promise demora muito", async () => {
    const slowPromise = new Promise((r) => setTimeout(r, 2000));

    await expect(withTimeout(slowPromise, 100)).rejects.toThrow("Tempo limite");
  });
});
