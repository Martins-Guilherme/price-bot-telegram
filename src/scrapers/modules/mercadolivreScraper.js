import axios from "axios";
import * as cheerio from "cheerio";

import { BaseScraper } from "../baseScraper.js";

import { MercadoLivreScraperError } from "../../errors/index.js";

/**
 * @description A classe MercadoLivreScraper é responsável por realizar buscas de produtos no site MercadoLivre. Ela estende a classe BaseScraper e implementa o método search, que recebe o nome do produto a ser buscado e retorna uma lista de resultados contendo informações como imagem, título, link e preço dos produtos encontrados.
 *
 * @example
 * const scraper = new MercadoLivreScraper();
 * const results = await scraper.search("notebook");
 * console.log(results);
 *
 * @returns {Object[]} Uma lista de objetos contendo informações dos produtos encontrados, como imagem, título, link, recurso e preço.
 */

class MercadoLivreScraper extends BaseScraper {
  name = "Mercado Livre";
  async search(productName) {
    if (!productName)
      throw new MercadoLivreScraperError("Produto não informado");

    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(productName)}`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
        },
      });

      const $ = cheerio.load(data);
      const results = [];

      $("ol[data-cols] li").each((_, el) => {
        const image = $(el)
          .find("div[data-andes-card] div.poly-card__portada img")
          ?.attr("src");

        const title = $(el).find("div[data-andes-card] h3")?.text();

        const link = $(el).find("div[data-andes-card] h3 a")?.attr("href");

        const priceFractions = $(el)
          .find("div.poly-component__price div.poly-price__current")
          .first()
          .find(".andes-money-amount__fraction")
          .first()
          .text()
          .replace(".", "");

        const priceCents =
          $(el)
            .find("div.poly-component__price div.poly-price__current")
            .first()
            .find(".andes-money-amount__cents")
            .first()
            .text() || "00";

        if (!title || !priceFractions) return;

        const price = parseFloat(`${priceFractions}.${priceCents}`);

        results.push({
          image,
          title,
          link,
          price,
          source: "mercadolivre",
        });
      });

      return results.slice(0, 5);
    } catch (error) {
      console.error("Erro no MercadoLivreScraper:", error);
      return [];
    }
  }
}

export default MercadoLivreScraper;
