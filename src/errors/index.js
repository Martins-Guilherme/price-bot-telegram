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

export class TimeoutPqueueError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutPqueueError";
  }
}
export class BotValidationNameError extends Error {
  constructor(message) {
    super(message);
    this.name = "BotValidationNameError";
  }
}

export class BotNotProductFoundException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotNotProductFoundException";
  }
}

export class BotRateLimitException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotRateLimitException";
  }
}

export class BotProductNotArrayException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotProductNotArrayException";
  }
}

export class BotInvalidProductDataException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotInvalidProductDataException";
  }
}
