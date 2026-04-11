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
