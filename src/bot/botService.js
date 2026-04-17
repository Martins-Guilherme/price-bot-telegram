import { savePrices } from "../services/priceService.js";

import { getAllScrapers, getScraper } from "../scrapers/index.js";

import { getCache } from "../utils/cache.js";
import { canUse } from "../utils/rateLimit.js";
import { scraperQueue, withTimeout } from "../utils/queue.js";
import { setCache } from "../utils/cache.js";

import {
  AmazonScraperError,
  KabumScraperError,
  MercadoLivreScraperError,
  BotValidationNameError,
  BotRateLimitException,
  BotNotProductFoundException,
  BotProductNotArrayException,
  BotInvalidProductDataException,
  BotRatLimitIsNotNumberError,
} from "../errors/index.js";

/**
 * Fluxo de execução do bot:
 *
 * 1. O usuário envia uma mensagem com o nome do produto que deseja buscar.
 *
 * 2. O bot valida o nome do produto, aplicando regras básicas para evitar buscas vazias ou com caracteres inválidos.
 *
 * 3. O bot verifica se o produto já foi buscado recentemente para evitar buscas repetidas.
 *
 * 4. O bot inicia o processo de busca utilizando os scrapers disponíveis, aplicando controle de timeout, tratamento de erros e fila para evitar bloqueios.
 *
 * 5. O bot processa os resultados encontrados, ordena por preço e envia uma mensagem formatada com os detalhes do produto, incluindo título, preço, link e imagem (se disponível).
 *
 * 6. O bot salva os resultados no banco de dados para futuras consultas e cache.
 *
 * 7. Em caso de erros específicos, como bloqueio do scraper ou produto não encontrado, o bot envia mensagens de erro claras para o usuário.
 */

/**
 * @alias verifyRawNameProduct (bot, chatId, rawProduct)
 * @description Verifica o nome do produto enviado pelo usuário, controla o rate limit limita para evitar abusos do uso do bot, faz chamadas para funções assincronas para verificar o cache e inicia a busca caso o produto seja válido e não tenha resultados recentes.
 *
 * @param {TelegramBot} bot - Instância do Telegram Bot para enviar mensagens de status e resultados.
 * @param {number} chatId - ID do chat para enviar mensagens.
 * @param {string} rawProduct - Nome do produto cru enviado pelo usuário.
 * @param {object} err -  Erro de retorno dentro do throw da saida da função.
 * @returns {Promise<void>} Retorna uma promessa que resolve quando o processo de busca e envio de resultados estiver concluído, ou rejeita com um erro específico em caso de falhas de validação ou busca.
 */

// 1. Validação básica para evitar buscas vazias ou com caracteres inválidos, rate limite.
export async function verifyRawNameProduct(chatId, bot, rawProduct) {
  try {
    console.time("validarNome");
    // 1. Validação básica para evitar buscas vazias ou com caracteres inválidos.
    if (!rawProduct || !/^[a-zA-ZÀ-ÿ0-9\s\-]+$/.test(rawProduct)) {
      return enviarMensagemDeErro({
        bot,
        chatId,
        err: new BotValidationNameError(
          "Não aceita buscas com caracteres especiais.",
        ),
      });
    }
    // 2. Controle de rate limit para evitar abusos e bloqueios
    if (!canUse(chatId)) {
      return enviarMensagemDeErro({
        bot,
        chatId,
        err: new BotRateLimitException("Usuário atingiu o limite de buscas."),
      });
    }

    // 3. Setando o produto para uma versão mais limpa, removendo múltiplos espaços e caracteres extras
    const product = rawProduct.replace(/\s+/g, " ");

    // 4. Verificar cache antes de realizar a busca.
    const isCachedName = await verifyCachedName(product);

    if (Array.isArray(isCachedName) && isCachedName.length > 0) {
      await bot.sendMessage(chatId, "⚡ Resultados recentes encontrados:");
      console.timeEnd("validarNome");
      return sendOutputData(bot, chatId, isCachedName);
    }

    // 5. Enviar mensagem de carregamento e realizar a busca caso não tenha cache.
    await bot.sendMessage(chatId, `🔎 Buscando '${product}'...`);
    const results = await findScraperAndSearch(product);
    if (!Array.isArray(results) || results.length === 0) {
      return enviarMensagemDeErro({
        bot,
        chatId,
        err: new BotProductNotArrayException("O resultado não é um array."),
      });
    }
    if (!results || results.length === 0) {
      return enviarMensagemDeErro({
        chatId,
        bot,
        err: new BotNotProductFoundException("Nenhum resultado encontrado."),
      });
    }

    // 5. Processar os resultados, salvar no banco e enviar para o usuário.
    const response = await processResults(product, results);

    // 6. Chama a função para enviar os resultados formatados para o usuário.
    console.timeEnd("validarNome");
    await sendOutputData(bot, chatId, response);
  } catch (err) {
    console.error(`Erro inesperado: ${err.message}`);
    return enviarMensagemDeErro({
      chatId,
      bot,
      err,
    });
  }
}

/**
 * @alias findScraperAndSearch (product)
 * @description Busca o produto em todos os scrapers disponíveis.
 *
 * @param {string} product - Nome do produto a ser buscado.
 * @returns {Promise<Array>} Array de objetos com os resultados encontrados, cada um contendo título, preço, link, imagem e fonte.)
 */
// 2 - Buscar o produto em todos os scrapers disponíveis.
export async function findScraperAndSearch(product) {
  // Buscar todos os scrapers e coletar os resultados
  const scrapers = getAllScrapers();
  try {
    // Executar os scrapers em paralelo com controle de timeout, tratamento de erros e fila para evitar bloqueios
    const resultsArrays = await Promise.allSettled(
      scrapers.map((scraper) =>
        scraperQueue.add(async () => {
          if (!scraper) {
            console.error("Erro ao executar o scraper, retorno vazio.");
            return [];
          }
          try {
            return await withTimeout(scraper.search(product), 9000);
          } catch (err) {
            enviarMensagemDeErro(
              bot,
              chatId,
              new Error(`Erro no scraper ${scraper}: ${err}`),
            );
          }
        }),
      ),
    );

    // Filtrar resultados válidos e combinar em um único array
    const results = resultsArrays
      .filter((r) => r.status === "fulfilled" && Array.isArray(r.value))
      .flatMap((r) => r.value)
      .filter((p) => p && p.price && p.title);

    return results || [];
  } catch (err) {
    console.error("Erro ao filtrar os resultados:", err.message);
    return [];
  }
}

/**
 * Detalhamento das funcionalidades de suporte e processamento:
 *
 * 1. verifyCachedName(product):
 *    - Realiza a consulta na camada de cache (utilizando a utilidade getCache) para verificar se o produto já foi buscado.
 *    - Caso positivo, renova a expiração do cache com setCache para manter os dados quentes e retorna os resultados imediatamente,
 *      poupando recursos computacionais e evitando bloqueios nos scrapers.
 *
 * 2. limparMensagem(bot, chatId, message, timer):
 *    - Gerencia a limpeza da interface do usuário no Telegram.
 *    - Utiliza um temporizador (setTimeout) para remover mensagens temporárias (como avisos de carregamento ou erros),
 *      mantendo o histórico do chat limpo e focado no que é relevante.
 *
 * 3. processResults(product, results):
 *    - Atua como o orquestrador de pós-busca.
 *    - Ordena os resultados brutos por preço (crescente) para garantir que o usuário veja as melhores ofertas primeiro.
 *    - Seleciona os 5 melhores resultados (topResults) e os persiste no banco de dados via savePrices para fins de histórico e auditoria.
 *
 * 4. sendOutputData(bot, chatId, topResults):
 *    - Responsável pela apresentação visual dos dados.
 *    - Formata títulos longos para garantir a legibilidade e constrói mensagens ricas (Markdown) com botões inline de compra.
 *    - Tenta enviar fotos dos produtos para aumentar a taxa de conversão, com fallback para mensagens de texto caso a imagem falhe.
 *    - Implementa um pequeno delay entre envios para respeitar os limites de requisição da API do Telegram.
 *
 * 5. enviarMensagemDeErro(chatId, bot, err):
 *    - Centralizador de tratamento de exceções da aplicação.
 *    - Identifica o tipo de erro (Rate Limit, Produto não encontrado, Erros de Scraper) e mapeia para uma mensagem amigável ao usuário.
 *    - Garante que o usuário final nunca fique sem resposta, mesmo quando ocorrem falhas técnicas ou bloqueios de terceiros.
 */

// 1. Verificar cache antes de realizar a busca
async function verifyCachedName(product) {
  return await getCache(product);
}

// 2. Aplicar técnicas de limpeza.
async function limparMensagem(bot, chatId, message, timer = 0) {
  setTimeout(async () => {
    try {
      await bot.deleteMessage(chatId, message.message_id);
    } catch (e) {
      // Silencia erro se a mensagem já foi apagada ou usuário limpou o chat
      console.error("Erro ao deletar mensagem:", e.message);
    }
  }, timer);
  return;
}

// 3. Processar os resultados encontrados, ordenando por preço e salvando no banco de dados.
export async function processResults(product, results) {
  const sortedResults = results.sort((a, b) => a.price - b.price);

  const topResults = sortedResults.slice(0, 5);

  await savePrices(product, topResults);

  setCache(product, topResults);

  return topResults;
}

// 4. Retorno da mensagem com os resultados encontrados, caso tenha cache, formatando o título, preço e link de forma clara e atrativa para o usuário.
async function sendOutputData(bot, chatId, topResults) {
  try {
    console.time("EnviarDadosParaOUsuario");
    if (!Array.isArray(topResults)) {
      throw new BotProductNotArrayException("topResultados não é um array.");
    }
    const formatTitle = (title) => {
      return title.length > 100 ? title.slice(0, 90) + "..." : title;
    };

    for (const [i, p] of topResults.entries()) {
      try {
        if (!p.title)
          throw new BotInvalidProductDataException(
            "Produto sem título encontrado.",
          );
        if (p.price === null || p.price === undefined)
          throw new BotInvalidProductDataException(
            "Produto sem preço encontrado.",
          );
        if (!p.link)
          throw new BotInvalidProductDataException(
            "Produto sem link encontrado.",
          );
        const caption =
          `✨ *Oferta encontrada*\n\n` +
          `🏷️ *${formatTitle(p?.title)}*\n` +
          `💰 *R$ ${p?.price}*\n\n` +
          `📦 ${p?.source.toUpperCase()}`;
        const options = {
          caption,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🛒 Comprar",
                  url: p.link || "Sem link disponível",
                },
              ],
            ],
          },
        };

        if (p.image) {
          await bot.sendPhoto(chatId, p.image, options);
        } else {
          await bot.sendMessage(chatId, caption, {
            reply_markup: options.reply_markup,
          });
        }

        await new Promise((r) => setTimeout(r, 700));
      } catch (err) {
        console.error("Erro ao enviar: ", err.message);
        enviarMensagemDeErro({ bot, chatId, err });
      }
    }
    console.timeEnd("EnviarDadosParaOUsuario");
  } catch (err) {
    console.error("Erro ao enviar resultado para o usuário.");
    enviarMensagemDeErro({ bot, chatId, err });
  }
}

// 5 - Mensagem de erro específica para cada tipo de falha, como bloqueio do scraper, produto não encontrado ou erro de rede.
export async function enviarMensagemDeErro({ chatId, bot, err }) {
  console.time("EnviarMensagemdeErro");
  let spanMsg, logError;
  if (err instanceof BotRatLimitIsNotNumberError) {
    logError = "Entrada de dados inválida, chatId é uma string";
    spanMsg = await bot.sendMessage(
      chatId,
      "Erro ao repetir a requisição, comportamento inesperado.",
    );
  }
  if (err instanceof BotRateLimitException) {
    logError = "Usuário atingiu o limite de buscas por minuto:";
    spanMsg = await bot.sendMessage(
      chatId,
      "⏳ Aguarde 10 segundos antes de fazer outra busca.",
    );
  }
  if (err instanceof BotInvalidProductDataException) {
    logError = "Erro nos dados do produto encontrado:";
    spanMsg = await bot.sendMessage(
      chatId,
      `❌ Erro nos dados do produto encontrado.`,
    );
  }
  if (err instanceof BotNotProductFoundException) {
    logError = "A busca em todos os scrapers resultaram em falha";
    spanMsg = await bot.sendMessage(chatId, `❌ Nenhum resultado encontrado.`);
  }
  if (err instanceof BotProductNotArrayException) {
    logError = "topResultados não é uma array";
    spanMsg = await bot.sendMessage(chatId, `❌ Erro ao processar resultados.`);
  }
  if (err instanceof BotValidationNameError) {
    logError = "Erro de validação do nome do produto:";
    spanMsg = await bot.sendMessage(
      chatId,
      "❌ Informe um produto válido.\nEx: /buscar notebook",
    );
  }
  if (err instanceof AmazonScraperError) {
    logError = "Erro no scraper Amazon";
    spanMsg = await bot.sendMessage(
      chatId,
      "⚠️ Amazon bloqueou a requisição.\nTente novamente mais tarde.",
    );
    return (logError, spanMsg);
  }
  if (err instanceof MercadoLivreScraperError) {
    logError = "Erro no scraper Mercado livre";
    spanMsg = await bot.sendMessage(
      chatId,
      "⚠️ Mercado livre bloqueou a requisição.\nTente novamente mais tarde.",
    );
  }
  if (err instanceof KabumScraperError) {
    logError = "Erro no scraper Kabum";
    spanMsg = await bot.sendMessage(
      chatId,
      "⚠️ Kabum bloqueou a requisição.\nTente novamente mais tarde.",
    );
  }
  console.error(
    `${logError ? logError : "Erro inesperado"}: ${err.name} - ${err.message}`,
  );
  if (!spanMsg) return (spanMsg = "⚠️ Ocorreu um erro inesperado.");
  console.timeEnd("EnviarMensagemdeErro");
  return await spanMsg;
}
