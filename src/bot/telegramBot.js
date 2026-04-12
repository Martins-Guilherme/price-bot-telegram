import TelegramBot from "node-telegram-bot-api";

import { getAllScrapers } from "../scrapers/index.js";

import { savePrices } from "../services/priceService.js";
import {
  TelegramDeletMessageError,
  TelegramImageNotFoundError,
} from "../errors/index.js";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Olá! Eu sou o Price Bot.\nEnvie o nome de um produto para receber uma cotação.\nUse:\n/buscar nome-do-produto",
  );
});

bot.onText(/\/buscar (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const product = match[1]?.trim().replace(/\s+/g, " ");

  if (!product) {
    return bot.sendMessage(
      chatId,
      "❌ Informe um produto.\nEx: /buscar notebook",
    );
  }

  const formatTitle = (title) => {
    return title.length > 100 ? title.slice(0, 90) + "..." : title;
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

    if (!results.length) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      return bot.sendMessage(chatId, "❌ Nenhum resultado encontrado.");
    }

    // Ordenar por menor preço
    const sortedResults = results.sort((a, b) => a.price - b.price);

    const topResults = sortedResults.slice(0, 5);

    await savePrices(topResults);

    try {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    } catch {
      throw new TelegramDeletMessageError("Erro ao tentar deletar a mensagem");
    }

    // Mensagem com a foto do produto
    for (const [i, p] of topResults.entries()) {
      const caption =
        `✨ *Oferta encontrada*\n\n` +
        `🏷️ *${formatTitle(p.title)}*\n` +
        `💰 *R$ ${p.price.toFixed(2)}*\n\n` +
        `📦 ${p.source.toUpperCase()}`;
      const options = {
        caption,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🛒 Comprar",
                url: p.link || "https://amzn.to/4szpZ1z",
              },
            ],
          ],
        },
      };

      try {
        if (p.image) {
          await bot.sendPhoto(chatId, p.image, options);
        } else {
          await bot.sendPhoto(chatId, caption, {
            reply_markup: options.reply_markup,
          });
        }
      } catch (err) {
        console.log("⚠️ Erro ao enviar: ", err.message);

        await bot.sendMessage(chatId, caption, {
          reply_markup: options.reply_markup,
        });
      }

      await new Promise((r) => setTimeout(r, 800));
    }
  } catch (err) {
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
