import PQueue from "p-queue";

import { TimeoutPqueueError } from "../errors/index.js";

export const scraperQueue = new PQueue({
  concurrency: 2, // fila de execução com 2 tarefas simultâneas
});

export const withTimeout = async (promise, ms = 15000) => {
  const controller = new AbortController();
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new TimeoutPqueueError("Tempo limite"));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => controller.abort());
};
