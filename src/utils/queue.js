import PQueue from "p-queue";

export const scraperQueue = new PQueue({
  concurrency: 2, // fila de execução com 2 tarefas simultâneas
});

export const withTimeout = (promise, ms = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tempo limite")), ms),
    ),
  ]);
};
