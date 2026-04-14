import { BaseScraperError } from "../errors/index.js";

/**
 * @description A classe BaseScraper serve como uma classe base para os scrapers específicos de cada plataforma. Ela define a estrutura básica e o contrato que os scrapers devem seguir, garantindo que todos implementem o método search para realizar a busca de produtos.
 *
 * @returns {BaseScraper} Uma instância da classe BaseScraper, que serve como base para os scrapers específicos de cada plataforma.
 *
 */
export class BaseScraper {
  async search(productName) {
    throw new BaseScraperError("Metodo não implementado");
  }
}
