## 🧠 Fluxo principal (Produção)

### 1. Entrada do usuário

Usuário envia comando no Telegram:

/buscar notebook gamer

---

### 2. Recepção da requisição

Bot recebe via polling (Telegram Bot API)

---

### 3. Validação e segurança

- Sanitiza input (tamanho / formato)
- Aplica rate limit por usuário (anti-spam)
- (Opcional) valida whitelist

Se falhar → retorna erro amigável

---

### 4. Verificação de cache

- Busca no cache (TTL ~30 minutos)

Se existir:
→ retorna resposta imediatamente (FAST PATH 🚀)

---

### 5. Orquestração de scraping

Caso não haja cache:

- Carrega scrapers disponíveis:
  → getAllScrapers()

- Executa via fila controlada:
  → concorrência limitada ( 2 )

- Cada execução possui:
  → timeout individual
  → isolamento de erro (Promise.allSettled)

---

### 6. Coleta e consolidação

- Filtra apenas resultados válidos (fulfilled)
- Normaliza dados:
  - product
  - title
  - price
  - link
  - image
  - source

---

### 7. Processamento

- Ordena por menor preço
- Seleciona TOP 5 resultados

---

### 8. Persistência

- Salva resultados no SQLite
- Mantém histórico de preços
- Salva os dados com o horário GTM-3 (Brasil)

---

### 9. Cache

- Armazena resultado da busca
- Evita scraping repetido

---

### 10. Resposta ao usuário

- Remove mensagem de loading
- Envia resultados com:
  - imagem
  - preço
  - botão inline (🛒 Comprar)

---

### 11. Tratamento de erro

- Falha de scraper não interrompe fluxo
- Erros são logados
- Usuário recebe mensagem amigável

---

### 12. Paralelo: API (se utilizada)

- API pode acessar dados persistidos
- Possível uso para:
  - histórico
  - analytics
  - integrações futuras
