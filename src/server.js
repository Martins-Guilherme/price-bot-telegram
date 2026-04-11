import express from "express";
import { getScraper } from "./scrapers/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

export function startServer(bot) {
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Price Bot rodando!");
  });

  app.get("/buscar", async (req, res) => {
    const product = req.query.q;

    if (!product) {
      return res.status(400).json({ error: "Parâmetro 'q' é obrigatório" });
    }

    try {
      const scraper = getScraper("amazon");
      const results = await scraper.search(product);

      res.json(results.slice(0, 5));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar os preços." });
    }
  });

  app.get("/health", (req, res) => {
    res.send("OK");
  });

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}
