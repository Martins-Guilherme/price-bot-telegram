import db from "../db/database.js";
export async function savePrices({ product, prices }) {
  let data = new Date();
  data.setHours(data.getHours() - 3);
  const stmt = db.prepare(`
    INSERT INTO prices (product, product_found, price, source, image, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((prices) => {
    for (const p of prices) {
      const price = parseFloat(p.price);

      if (price === null || price === undefined || !price || isNaN(price)) continue;

      stmt.run(
        product,
        p.title,
        price,
        p.source || "unknown",
        p.image || null,
        p.link || null,
      );
    }
  });

  insertMany(prices);
  console.log(
    `💾 ${prices.length} preços salvos -- ${data.toLocaleString("pt-br")}`,
  );
}
