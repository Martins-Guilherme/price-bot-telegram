# 📦 PRICE BOT (NODE + DOCKER + SQLITE + TELEGRAM)

## 🎯 Objetivo

Construir um bot que:

- Busca preços de produtos (inicialmente na Amazon)
- Salva os dados em um banco SQLite
- Responde via Telegram

---

## 🧱 Arquitetura Atual

### 🐳 Docker

Este diretório contém a configuração de containerização para o Price Bot. A solução foi projetada para superar desafios de compilação de dependências nativas (better-sqlite3) e execução do ambiente headless para o Puppeteer.

- Container roda Node.js + SQLite
- Volume persistente:
  - `/database` → banco SQLite
  - `/app` → código backend (montado via volume)

### Diretorio

[Diretorio do projeto](https://github.com/Martins-Guilherme/price-bot-telegram-docker)

### 🏗️ Estrutura de Arquivos

```
  ~/Docker/sqlite-bot
    ├── db/                # Volume persistente para o SQLite
    │   └── data.db        # Arquivo de banco de dados
    ├── Dockerfile         # Definição da imagem (Debian-based)
    └── docker-compose.yml # Orquestração do serviço e volumes
```

### 📄 Dockerfile

```
  FROM node:20

  RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libasound2 \
    libnss3 \
    libxss1 \
    libgtk-3-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

  WORKDIR /app

  COPY package*.json ./
  RUN npm install

  COPY . .

  RUN npm rebuild better-sqlite3

  CMD ["node", "src/index.js"]

```

### ⚙️ Docker Compose

```
  services:
  price-bot:
    build:
      context: ../../vendaOnline
      dockerfile: ../Docker/sqlite-bot/Dockerfile
    container_name: price-bot
    volumes:
      - ./db:/database        # Mapeia o banco para persistência externa
    ports:
      - "3000:3000"           # Porta da API Express
    env_file:
      - ../../vendaOnline/.env # Carrega variáveis como TELEGRAM_TOKEN
    restart: unless-stopped
```

### 📁 Estrutura do projeto (backend)

```
 src/
├── bot/
│   ├── botService.js         # Lógica de negócio do bot
│   └── telegramBot.js        # Integração com API do Telegram
├── db/
│   └── database.js           # Conexão e queries SQLite
├── errors/
│   └── index.js              # Tratamento centralizado de erros
├── helpers/
│   └── tests/                # Testes e mocks
│       ├── bot/
│       ├── mocks
│       │   └── botMock.js
│       ├── scrapers/
│       ├── utils/
│       │   ├── cache.spec.js
│       │   └── rateLimite.spec.js
│       ├── components.js
│       └── index.js
├── scrapers/
│   ├── baseScraper.js        # Interface base dos scrapers
│   ├── factory.js            # Factory getScraper()
│   ├── index.js
│   └── modules/
│       ├── amazonScraper.js
│       ├── kabumScraper.js
│       └── mercadolivreScraper.js
├── services/
│   └── priceService.js       # Orquestração da busca de preços
├── utils/
│   ├── browser.js            # Configuração do Puppeteer
│   ├── cache.js              # Cache em memória (TTL)
│   ├── queue.js              # Fila de concorrência (pqueue)
│   └── rateLimit.js          # Controle de cooldown por usuário
├── index.js                  # Entry point
└── server.js                 # API Express
```

---

## ⚙️ Stack utilizada

- Node.js (ES Modules)
- Express.js (API)
- SQLite (persistência)
- node-telegram-bot-api (bot)
- Cheerio (scraping)
- pqueue (Fila de concorrência)
- Axios (HTTP)

---

## 🚀 Funcionamento Atual

### ✔ Bot Telegram

- `/start` → responde mensagem inicial
- `/buscar notebook` →:
  - chama scraper
  - retorna resultados

### ✔ API HTTP

- GET `/buscar?q=produto` → retorna JSON com resultados
- GET `/health` → OK

---

## 🧠 Fluxo principal

[Fluxo principal](FLUXO.md)

---

## 💾 Estado atual do banco

### Arquivo:

```
/database/data.db
```

### Tabela criada:

```sql
CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT NOT NULL,
    product_found TEXT NOT NULL DEFAULT 'Produto não encontrado',
    price REAL NOT NULL,
    source TEXT NOT NULL,
    image TEXT,
    link TEXT,
    created_at DATETIME DEFAULT (datetime('now', '-3 hours'))
);
```

---

## 📌 REGRAS IMPORTANTES DO PROJETO

- Usar ES Modules (`type: module`)
- Sempre usar `.js` nos imports
- Backend roda dentro do Docker
- Variáveis vêm do backend
- Scrapers desacoplados via factory (`getScraper`)

---

## 🚀 Como Executar

### 1 - Preparação:

Certifique-se de que o arquivo .env no diretório vendaOnline contém as credenciais necessárias e que o caminho do banco no docker-compose aponte para /database/data.db.

### 2 - Build e Start:

Navegue até a pasta da infraestrutura e suba o container:

```
  cd ~/Docker/sqlite-bot
  docker-compose up -d --build
```

### 3 - Verificação:

Acompanhe os logs para garantir que o bot e o Puppeteer iniciaram corretamente:

```
  docker logs -f price-bot
```

---

## 📍 RESUMO FINAL

### ✅ roda em Docker

### ✅ responde via Telegram

### ✅ faz scraping

### ✅ expõe API

### ✅ Seguro contra spam

### ✅ Controlado (sem explodir CPU)

### ✅ Mais rápido (com cache)

### ✅ Resiliente (tratamento de erros)

### ✅ Escalável

### ✅ fila queue (concorrência limitada)

### ✅ puppeteer rodando headless

---
