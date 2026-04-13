import axios from "axios";
import * as cheerio from "cheerio";
import { BaseScraper } from "../baseScraper.js";

class KabumScraper extends BaseScraper {
  async search(productName) {
    const url = `https://www.kabum.com.br/busca/${encodeURIComponent(productName)}`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    $(".productCard").each((_, el) => {
      const title = $(el).find(".nameCard").text().trim();
      const priceRaw = $(el).find(".priceCard").text().trim();

      if (!title || !priceRaw) return;

      const price = parseFloat(
        priceRaw.replace("R$", "").replace(/\./g, "").replace(",", "."),
      );

      results.push({
        title,
        price,
        source: "kabum",
      });
    });

    return results;
  }
}

export default KabumScraper;
