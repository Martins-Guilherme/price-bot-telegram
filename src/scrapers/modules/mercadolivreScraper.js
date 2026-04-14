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
  async search(productName) {
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(productName)}`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    $(".ui-search-result").each((_, el) => {
      const title = $(el).find(".ui-search-item__title").text().trim();
      const priceWhole = $(el).find(".price-tag-fraction").text();
      const priceCents = $(el).find(".price-tag-cents").text();

      if (!title || !priceWhole) return;

      const price = parseFloat(`${priceWhole}.${priceCents || "00"}`);

      results.push({
        title,
        price,
        source: "mercadolivre",
      });
    });

    return results;
  }
}

export default MercadoLivreScraper;
