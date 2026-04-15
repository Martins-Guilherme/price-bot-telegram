import TelegramBot from "node-telegram-bot-api";

import { verifyRawNameProduct } from "./botService.js";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Olá! Eu sou o Price Bot.\nEnvie o nome de um produto que deseja comprar e receba uma cotação com o link de compra.\nUse: /buscar nome do produto",
  );
});

bot.onText(/\/buscar\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const rawProduct = match[1]?.trim();
  try {
    await verifyRawNameProduct(chatId, bot, rawProduct);
  } catch (err) {
    console.error("Erro ao processar a busca:", err);
  }
});

export default bot;
