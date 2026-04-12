import TelegramBot from "node-telegram-bot-api";

import { getAllScrapers } from "../scrapers/index.js";

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

  const loadingMsg = await bot.sendMessage(
    chatId,
    `🔎 Buscando '${product}'...`,
  );
  try {
    const scrapers = getAllScrapers();

    const resultsArrays = await Promise.allSettled(
      scrapers.map((scraper) => scraper.search(product)),
    );

    const results = resultsArrays
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    if (!resultsArrays.length) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      return bot.sendMessage(chatId, "❌ Nenhum resultado encontrado.");
    }

    // Ordenar por menor preço
    const sortedResults = results.sort((a, b) => a.price - b.price);

    const topResults = sortedResults.slice(0, 5);

    await savePrices(topResults);

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    const message = topResults
      .map((p, i) => {
        const link = p.link ? `\n🔗 ${p.link}` : "";
        return `#${i + 1} [${p.source.toUpperCase()}]
          ${formatTitle(p.title)}
          💰 R$ ${p.price.toFixed(2)}${link}`;
      })
      .join("\n\n");

    await bot.sendMessage(chatId, message);
  } catch (err) {
    console.error(err);

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    if (err.name === "AmazonScraperError") {
      return bot.sendMessage(
        chatId,
        "⚠️ Amazon bloqueou a requisição. Tente novamente mais tarde.",
      );
    }

    await bot.sendMessage(
      chatId,
      "❌ Ocorreu um erro ao buscar o produto. Tente novamente mais tarde.",
    );
  }
});

export default bot;
