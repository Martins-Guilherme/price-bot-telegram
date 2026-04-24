import PQueue from "p-queue";

import { TimeoutPqueueError } from "../errors/index.js";

export const scraperQueue = new PQueue({
  concurrency: 2, // fila de execução com 2 tarefas simultâneas
});

export const withTimeout = (promise, ms = 15000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new TimeoutPqueueError("Tempo limite")), ms),
    ),
  ]);
};
