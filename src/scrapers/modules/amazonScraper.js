import { getBrowser } from "../../utils/browser.js";

import { AmazonScraperError } from "../../errors/index.js";

import { BaseScraper } from "../baseScraper.js";

/**
 * @description A classe AmazonScraper é responsável por realizar buscas de produtos no site Amazon. Ela estende a classe BaseScraper e implementa o método search, que recebe o nome do produto a ser buscado e retorna uma lista de resultados contendo informações como imagem, título, link e preço dos produtos encontrados.
 *
 * @example
 * const scraper = new AmazonScraper();
 * const results = await scraper.search("notebook");
 * console.log(results);
 *
 * @returns {Object[]} Uma lista de objetos contendo informações dos produtos encontrados, como imagem, título, link, recurso e preço.
 */

class AmazonScraper extends BaseScraper {
  name = "Amazon";
  async search(productName) {
    if (!productName) throw new AmazonScraperError("Produto não informado");

    const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(productName)}`;

    const browser = await getBrowser();

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);

    try {
      await page.setExtraHTTPHeaders({
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
      });

      await page.setViewport({
        width: 1366,
        height: 768,
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });
      });

      await page.goto(url, {
        signal: AbortSignal.timeout(60000),
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      if (await page.$("form[action='/errors/validateCaptcha']")) {
        throw new AmazonScraperError("Bloqueio por CAPTCHA!");
      }

      await page.waitForSelector(
        ".s-result-item[data-component-type='s-search-result']",
        {
          timeout: 15000,
        },
      );

      const results = await page.evaluate(() => {
        const items = [];

        document
          .querySelectorAll(
            ".s-result-item[data-component-type='s-search-result']",
          )
          .forEach((el) => {
            const title = el.querySelector("h2 span")?.innerText;
            const priceRaw = el.querySelector(
              ".a-price .a-offscreen",
            )?.innerText;
            const link = el.querySelector(".a-section a")?.href;
            const image = el.querySelector("img")?.src;

            if (!title || !priceRaw) return;

            const price = priceRaw
              ? parseFloat(
                  priceRaw
                    .replace("R$", "")
                    .replace(/\s/g, "")
                    .replace(/\./g, "")
                    .replace(",", "."),
                )
              : NaN;

            items.push({
              title,
              price,
              link,
              image,
              source: "amazon",
            });
          });
        return items.slice(0, 5);
      });
      return results;
    } catch (err) {
      console.error("Erro no AmazonScraper:", err);
      return [];
    } finally {
      if (page && !page.isClosed()) await page.close();
      if (browser) await browser.close();
    }
  }
}

export default AmazonScraper;
