import TelegramBot from "node-telegram-bot-api";

import { getAllScrapers, getScraper } from "../scrapers/index.js";

import { savePrices } from "../services/priceService.js";

import { canUse } from "../utils/rateLimit.js";
import { getCache, setCache } from "../utils/cache.js";
import { scraperQueue, withTimeout } from "../utils/queue.js";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

async function limparMensagem(id, message, timer = 0) {
  setTimeout(async () => {
    try {
      await bot.deleteMessage(id, message.message_id);
    } catch (e) {
      // Silencia erro se a mensagem já foi apagada ou usuário limpou o chat
      console.error("Erro ao deletar mensagem:", e.message);
    }
  }, timer);
  return;
}

async function enviarResultadoParaOUsuario(chatId, topResults) {
  const formatTitle = (title) => {
    return title.length > 100 ? title.slice(0, 90) + "..." : title;
  };

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
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Olá! Eu sou o Price Bot.\nEnvie o nome de um produto que deseja comprar e receba uma cotação com o link de compra.\nUse: /buscar nome do produto",
  );
});

bot.onText(/\/buscar\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const rawProduct = match[1]?.trim();

  // 1. Validação básica para evitar buscas vazias ou com caracteres inválidos
  if (!rawProduct || !/^[a-zA-ZÀ-ÿ0-9\s\-]+$/.test(rawProduct)) {
    return bot.sendMessage(
      chatId,
      "❌ Informe um produto.\nEx: /buscar notebook",
    );
  }
  // Setando o produto para uma versão mais limpa, removendo múltiplos espaços e caracteres extras
  const product = rawProduct.replace(/\s+/g, " ");

  // 2. Controle de rate limit para evitar abusos e bloqueios
  try {
    if (!canUse(msg.from.id)) {
      const spanMsg = await bot.sendMessage(
        chatId,
        "⏳ Aguarde alguns segundos antes de fazer outra busca.",
      );
      // Agendar a deleção de forma segura
      limparMensagem(chatId, spanMsg, 4000);
      return;
    }
  } catch (err) {
    console.error("Erro no controle no rate de limite", err);
  }

  // 3. Verificar cache antes de realizar a busca
  const cachedProducts = getCache(product);
  if (cachedProducts) {
    await bot.sendMessage(chatId, "⚡ Resultados recentes encontrados:");
    await enviarResultadoParaOUsuario(chatId, cachedProducts);
    return;
  }

  // 4. Enviar mensagem de carregamento e realizar a busca
  const loadingMsg = await bot.sendMessage(
    chatId,
    `🔎 Buscando '${product}'...`,
  );
  try {
    // Buscar todos os scrapers e coletar os resultados
    const scrapers = getAllScrapers();

    // Executar os scrapers em paralelo com controle de timeout, tratamento de erros e fila para evitar bloqueios
    const resultsArrays = await Promise.allSettled(
      scrapers.map((scraper) =>
        scraperQueue.add(async () => {
          try {
            return await withTimeout(scraper.search(product), 10000);
          } catch (err) {
            console.error(`Erro no scraper ${scraper.name}:`, err.message);
          }
        }),
      ),
    );

    // Filtrar resultados válidos e combinar em um único array
    const results = resultsArrays
      .filter((r) => r.status === "fulfilled" && Array.isArray(r.value))
      .flatMap((r) => r.value)
      .filter((p) => p && p.price && p.title);

    if (!results.length) {
      await limparMensagem(chatId, loadingMsg, 4000);
      return bot.sendMessage(chatId, "❌ Nenhum resultado encontrado.");
    }

    // Ordenar por menor preço
    const sortedResults = results.sort((a, b) => a.price - b.price);

    const topResults = sortedResults.slice(0, 5);

    await savePrices(product, topResults);

    setCache(product, topResults);

    await limparMensagem(chatId, loadingMsg);

    // Mensagem com a foto do produto e detalhes
    await enviarResultadoParaOUsuario(chatId, topResults);
  } catch (err) {
    await limparMensagem(chatId, loadingMsg);

    const errMsg =
      err.name === "AmazonScraperError"
        ? "⚠️ Amazon bloqueou a requisição. Tente novamente mais tarde."
        : "❌ Ocorreu um erro ao buscar o produto. Tente novamente mais tarde.";

    await bot.sendMessage(chatId, errMsg);
  }
});

export default bot;
