import puppeteer from "puppeteer";

let browserInstance = null;

export async function getBrowser() {
  return await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });
}

// 🔥 Fechamento seguro (Docker / CTRL+C / crash)
async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      console.log("🛑 Browser fechado com sucesso");
    } catch (err) {
      console.error("Erro ao fechar browser:", err.message);
    } finally {
      browserInstance = null;
    }
  }
}

// Captura encerramento do container/app
process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});
