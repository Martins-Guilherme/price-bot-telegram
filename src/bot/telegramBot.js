import TelegramBot from "node-telegram-bot-api";

import { getScraper } from "../scrapers/index.js";

import { savePrices } from "../services/priceService.js";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Olá! Eu sou o Price Bot.\nEnvie o nome de um produto para receber uma cotação.\nUse:\n/buscar nome-do-produto",
  );
});

bot.onText(/\/buscar (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const product = match[1]?.trim();

  if (!product) {
    return bot.sendMessage(
      chatId,
      "❌ Informe um produto.\nEx: /buscar notebook",
    );
  }

  const formatTitle = (title) => {
    return title.length > 80 ? title.slice(0, 70) + "..." : title;
  };

  try {
    const loadingMsg = await bot.sendMessage(
      chatId,
      `🔎 Buscando '${product}'...`,
    );

    const scraper = getScraper("amazon");
    const results = await scraper.search(product);

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    if (!results.length) {
      return bot.sendMessage(chatId, "❌ Nenhum resultado encontrado.");
    }
    await savePrices(product, results);

    const topResults = results.slice(0, 5);

    const message = topResults
      .map(
        (p, i) =>
          `#${i + 1}\n${formatTitle(p.title)}\n💰 R$ ${p.price.toFixed(2)}`,
      )
      .join("\n\n");

    await bot.sendMessage(chatId, message);
  } catch (err) {
    console.error(err);
    if (err.name === "AmazonScraperError") {
      return bot.sendMessage(
        chatId,
        "⚠️ Amazon bloqueou a requisição. Tente novamente mais tarde.",
      );
    }
    if (loadingMsg) {
      try {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
      } catch {}
    }
    await bot.sendMessage(
      chatId,
      "❌ Ocorreu um erro ao buscar o produto. Tente novamente mais tarde.",
    );
  }
});

export default bot;
