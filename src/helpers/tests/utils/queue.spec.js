import { withTimeout } from "../../../utils/queue.js";

describe("Queue / Timeout", () => {
  it("Deve resolver quando a promise é rápida", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 500)).resolves.toBe("ok");
  });

  it("Deve rejeitar quando a promise demora muito", async () => {
    const slowPromise = new Promise((resolve) =>
      setTimeout(() => resolve("done"), 1000),
    );
    await expect(withTimeout(slowPromise, 50)).rejects.toThrow("Tempo");
  });

  it("Deve propagar o erro original da promise", async () => {
    const fallingPromise = Promise.reject(new Error("Falha real"));

    await expect(withTimeout(fallingPromise, 500)).rejects.toThrow(
      "Falha real",
    );
  });

  it("Deve respeitar o timeout customizado", async () => {
    const customTimeout = new Promise((resolve) => {
      setTimeout(() => resolve("ok"), 100);
    });

    await expect(withTimeout(customTimeout, 1000)).resolves.toBe("ok");
  });
});
