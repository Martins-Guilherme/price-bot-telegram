import axios from "axios";
import * as cheerio from "cheerio";
import { BaseScraper } from "../baseScraper.js";
import { KabumScraperError } from "../../errors/index.js";
import { getBrowser } from "../../utils/browser.js";

class KabumScraper extends BaseScraper {
  name = "Kabum";
  timeout = 30000;
  async search(productName) {
    if (!productName) throw new KabumScraperError("Produto não informado");

    const baseURL = "https://www.kabum.com.br";
    const slug = productName.trim().toLowerCase().replace(/\s+/g, "-");

    const url = `${baseURL}/busca/${slug}`;

    let browser = await getBrowser();
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    // page.on("console", (msg) => console.log("KABUM PAGE:", msg.text()));

    try {
      await page.setJavaScriptEnabled(true);
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );

      await page.setExtraHTTPHeaders({
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
      });

      await page.setViewport({
        width: 1366,
        height: 768,
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
        Object.defineProperty(navigator, "languages", {
          get: () => ["pt-BR", "pt", "en"],
        });
        window.chrome = { runtime: {} };
      });

      await page.goto(url, {
        waitUntil: "networkidle2",
      });

      // Lógica de Scroll Otimizada
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          let distance = 400;
          let maxScrolls = 15;
          let scrolls = 0;

          let timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            scrolls++;

            if (
              totalHeight >= document.body.scrollHeight ||
              scrolls >= maxScrolls
            ) {
              clearInterval(timer);
              resolve();
            }
          }, 400);
        });
      });

      const items = await page.evaluate(() => {
        const results = [];

        document
          .querySelectorAll('a[href^="/produto/"][aria-label]')
          .forEach((el) => {
            const aria = el.getAttribute("aria-label") || "";

            const title = aria.split(", avaliação")[0]?.trim() || "Sem título";

            const priceMatch = aria.match(/R\$\s*([\d.,]+)/);

            const price = priceMatch ? parseFloat(priceMatch[1]) : NaN;

            const image =
              el.querySelector("img")?.src ||
              el.querySelector("img")?.getAttribute("data-src") ||
              "";

            const link = `https://www.kabum.com.br` + el.getAttribute("href");

            results.push({
              title,
              price,
              image,
              link,
              source: "kabum",
            });
          });

        return results.slice(0, 3);
      });
      return items;
    } catch (error) {
      console.error("Erro no scraper: ", error);
      return [];
    } finally {
      if (page && !page.isClosed()) await page.close();
      if (browser) await browser.close();
    }
  }
}

export default KabumScraper;
