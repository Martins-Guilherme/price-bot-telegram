import { BaseScraperError } from "../errors/index.js";

export class BaseScraper {
  async search(productName) {
    throw new BaseScraperError("Metodo não implementado");
  }
}

