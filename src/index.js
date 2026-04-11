import { configDotenv } from "dotenv";

configDotenv();

import "./bot/telegramBot.js";

import { startServer } from "./server.js";

console.log("🔍 Verificando variáveis de ambiente...");
console.log(
  `TELEGRAM_TOKEN: ${process.env.TELEGRAM_TOKEN ? "✅ Encontrado" : "❌ Não encontrado"}`,
);

if (!process.env.TELEGRAM_TOKEN) {
  console.error(
    "⚠️  TELEGRAM_TOKEN não encontrado. O bot do Telegram não será iniciado.",
  );
  process.exit(1);
}

console.log("🚀 Iniciando aplicação...");
console.log("🤖 Inicializando bot...");

startServer();
