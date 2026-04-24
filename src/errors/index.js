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

export class KabumScraperError extends Error {
  constructor(message) {
    super(message);
    this.name = "KabumScraperError";
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
export class BotNotSendResultError extends Error {
  constructor(message) {
    super(message);
    this.name = "BotNotSendResultError";
  }
}
export class BotNotCachedNameError extends Error {
  constructor(message) {
    super(message);
    this.name = "BotNotCachedNameError";
  }
}

export class BotNotProductFoundException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotNotProductFoundException";
  }
}
export class BotNameIsEmptyException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotNameIsEmptyException";
  }
}

export class BotNameIsUndefinedException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotNameIsUndefinedException";
  }
}

export class BotRateLimitException extends Error {
  constructor(message) {
    super(message);
    this.name = "BotRateLimitException";
  }
}

export class BotRatLimitIsNotNumberError extends Error {
  constructor(message) {
    super(message);
    this.name = "BotRatLimitIsNotNumberError";
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
