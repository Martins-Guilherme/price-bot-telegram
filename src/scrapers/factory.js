import { ScraperNotFoundError } from "../errors/index.js";

import AmazonScraper from "./modules/amazonScraper.js";
import KabumScraper from "./modules/kabumScraper.js";
import MercadoLivreScraper from "./modules/mercadolivreScraper.js";

const scraperTypes = {
  amazon: AmazonScraper,
  mercadolivre: MercadoLivreScraper,
  kabum: KabumScraper,
};

/**
 *
 * @param {String} type
 * @description Recebe o tipo do scraper desejado e retorna uma instância do scraper correspondente. Se o tipo não for encontrado, lança um erro do tipo ScraperNotFoundError.
 *
 * @example const amazonScraper = getScraper("amazon");
 *
 * @returns {BaseScraper} Uma instância do scraper correspondente ao tipo fornecido.
 */
export function getScraper(type) {
  const scraperClass = scraperTypes[type?.toLowerCase()];

  if (!scraperClass) {
    throw new ScraperNotFoundError(`Tipo de busca "${type}", não encontrado.`);
  }
  return new scraperClass();
}

/**
 * @alias getAllScrapers
 * @description Recebe uma chamada de função e retorna um array contendo instâncias de todos os scrapers registrados. Cada scraper é criado usando a classe correspondente definida no objeto scraperTypes.
 *
 * @returns {BaseScraper[]} Um array contendo instâncias de todos os scrapers registrados.
 */
export function getAllScrapers() {
  return Object.values(scraperTypes).map((ScraperClass) => new ScraperClass());
}
