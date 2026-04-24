import dotenv from "dotenv";

dotenv.config();

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  bail: 1,
  verbose: true,

  moduleNameMapper: {
    // Força o Jest a resolver o better-sqlite3 diretamente,
    // ignorando o sistema de bindings do pnpm que está falhando
    "^better-sqlite3$": "<rootDir>/src/helpers/tests/mocks/sqliteMock.js",
  },

  transform: {}, // Não precisamos de Babel/TypeScript para Vanilla JS

  // Garante que o dotenv funcione em cada thread de teste
  setupFiles: ["dotenv/config"],
};

export default config;
