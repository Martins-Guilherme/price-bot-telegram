import axios from "axios";
import * as cheerio from "cheerio";
import { BaseScraper } from "../baseScraper.js";

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
