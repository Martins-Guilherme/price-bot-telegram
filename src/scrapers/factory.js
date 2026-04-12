import { ScraperNotFoundError } from "../errors/index.js";

import AmazonScraper from "./modules/amazonScraper.js";
import KabumScraper from "./modules/kabumScraper.js";
import MercadoLivreScraper from "./modules/mercadolivreScraper.js";

const scraperTypes = {
  amazon: AmazonScraper,
  mercadolivre: MercadoLivreScraper,
  kabum: KabumScraper,
};

export function getScraper(type) {
  const scraperClass = scraperTypes[type?.toLowerCase()];

  if (!scraperClass) {
    throw new ScraperNotFoundError(`Tipo de busca "${type}", não encontrado.`);
  }
  return new scraperClass();
}

export function getAllScrapers() {
  return Object.keys(scraperTypes).map(
    (key) =>
      new scraperTypes[
        key
          .toLocaleLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      ](),
  );
}
