# SemaSearch Backend# SemaSearch Backend

Node.js backend for the SemaSearch WordPress plugin. Node.js backend for the SemaSearch WordPress plugin.

Handles product embedding via Jina AI and vector search via ZVec.Handles product embedding via Jina AI and vector search via ZVec.

---

## Requirements## Requirements

- Node.js 20+- Node.js 20+

- A Jina AI API key (free tier available)- A Jina AI API key (free tier available)

---

## Getting a Jina API Key## Getting a Jina API Key

1. Go to [https://jina.ai](https://jina.ai)1. Go to [https://jina.ai](https://jina.ai)

2. Sign up for a free account2. Sign up for a free account

3. Navigate to **API Keys** in your dashboard3. Navigate to **API Keys** in your dashboard

4. Copy your key — free tier includes 1M tokens (enough for thousands of products)4. Copy your key — free tier includes 1M tokens (enough for thousands of products)

---

## Installation## Installation

`bash`bash

cd backendcd backend

npm installnpm install

cp .env.example .envcp .env.example .env

````


**Important:** Edit `.env` and add your API keys:
- `JINA_API_KEY`: Your Jina AI API key
- `API_KEY`: Generate a secure random string for API authentication (e.g., using `openssl rand -hex 32`)

---

## Configuration

Key environment variables in `.env`:

```bash
# Required
JINA_API_KEY=your_jina_api_key_here
API_KEY=your_secure_random_api_key_here

# Optional (with defaults)
NODE_ENV=development
PORT=3000
MAX_FREE_PRODUCTS=500
SCORE_THRESHOLD=0.5

# CORS - Multiple sites supported
CORS_ORIGIN=*  # Dev: use *, Prod: https://site1.com,https://site2.com,https://site3.com
```

See `.env.example` for all available options.

**Multi-Site CORS Setup**: See `CORS-GUIDE.md` for detailed instructions on configuring multiple WordPress domains.

---

## Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
NODE_ENV=production npm start
```

---

## API Authentication

All endpoints except `/health` require authentication using Bearer token:

```bash
Authorization: Bearer <your-api-key>
```

---

## API Endpoints

### Health Check
```
GET /health
```
No authentication required. Returns server status.

### Index Products
```
POST /index
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "site_id": "my-site",
  "products": [
    {
      "id": "123",
      "title": "Product Name",
      "description": "Product description",
      "url": "https://example.com/product",
      "price": "$99.99",
      "image_url": "https://example.com/image.jpg"
    }
  ]
}
```

Limits:
- Max 100 products per request
- Max 500 products per site (free tier)

### Search Products
```
POST /search
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "site_id": "my-site",
  "query": "blue running shoes",
  "top_k": 8
}
```

Returns products with similarity score >= 0.5 (configurable).

### Delete Single Product
```
DELETE /index/:site_id/:product_id
Authorization: Bearer <api-key>
```

Deletes a specific product from the collection.

**Example:**
```bash
curl -X DELETE https://api.example.com/index/my-site/product-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Delete Collection
```
DELETE /collections/:site_id
Authorization: Bearer <api-key>
```

Permanently deletes all products for the given site.

---

## Utilities

### Generate API Key
```bash
npm run generate-key
```

Generates a cryptographically secure API key for authentication.

---

## Security Features

✅ API key authentication
✅ Rate limiting (100 requests/minute by default)
✅ Input validation and sanitization
✅ CORS configuration
✅ Request size limits
✅ Helmet security headers
✅ Structured logging
✅ Graceful shutdown

---

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Generate a strong `API_KEY` (min 32 characters)
- [ ] Set `CORS_ORIGIN` to your WordPress domain
- [ ] Configure proper logging (`LOG_LEVEL=info`)
- [ ] Set up process manager (PM2, systemd, etc.)
- [ ] Configure reverse proxy (nginx, Caddy)
- [ ] Set up SSL/TLS certificates
- [ ] Monitor logs and metrics
- [ ] Set up automated backups of `./data` directory

---

## Architecture

- **Express.js** - REST API framework
- **Jina AI** - Embedding generation (1024-dim vectors)
- **ZVec** - Local vector database
- **LRU Cache** - Embedding cache with memory limits
- **Pino** - High-performance logging

---

## Troubleshooting

**"API_KEY is not set" error:**
- Make sure you've created `.env` file and added `API_KEY`

**"Authentication required" on requests:**
- Include `Authorization: Bearer <your-api-key>` header

**"Too many requests" error:**
- You've hit the rate limit. Wait 1 minute or adjust `RATE_LIMIT_MAX_REQUESTS`

**Memory issues:**
- Reduce `MAX_CACHE_SIZE` in `.env`
- Ensure you're not indexing too many products at once

---
````
