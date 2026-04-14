export class BaseScraperError extends Error {
  constructor(message) {
    super(message);
    this.name = "BaseScraperError";
  }
}

export class ScraperNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "ScraperNotFoundError";
  }
}

export class AmazonScraperError extends Error {
  constructor(message) {
    super(message);
    this.name = "AmazonScraperError";
  }
}

export class MercadoLivreScraperError extends Error {
  constructor(message) {
    super(message);
    this.name = "MercadoLivreScraperError";
  }
}

export class TelegramImageNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "TelegramImageNotFoundError";
  }
}

export class TelegramDeletMessageError extends Error {
  constructor(message) {
    super(message);
    this.name = "TelegramDeletMessageError";
  }
}
