import db from "../db/database.js";

export function savePrices(product, prices) {
  const stmt = db.prepare(
    "INSERT INTO prices (product, price, source) VALUES (?, ?, ?)",
  );

  const insertMany = db.transaction((prices) => {
    for (const p of prices) {
      const price = parseFloat(p.price);

      if (!price || isNaN(price)) continue;

      stmt.run(product, price, p.source || "amazon");
    }
  });
  
  insertMany(prices)

  console.log(`💾 ${prices.length} preços salvos`);
}
