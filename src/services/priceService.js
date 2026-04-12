import db from "../db/database.js";

export function savePrices(prices) {
  const stmt = db.prepare(`
    INSERT INTO prices (product, price, source, image, link)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((prices) => {
    for (const p of prices) {
      const price = parseFloat(p.price);

      if (!price || isNaN(price)) continue;

      stmt.run(
        p.title,
        price,
        p.source || "unknown",
        p.image || null,
        p.link || null,
      );
    }
  });

  insertMany(prices);
  console.log(`💾 ${prices.length} preços salvos`);
}
