import { ScraperNotFoundError } from "../errors/index.js";
import AmazonScraper from "./modules/amazonScraper.js";

const scraperTypes = {
  amazon: AmazonScraper,
};

export function getScraper(type) {
  const normalized = type.toLowerCase()

  const scraperClass = scraperTypes[normalized];

  if (!scraperClass) {
    throw new ScraperNotFoundError(`Scraper of type "${type}", not found.`);
  }

  return new scraperClass();
}
