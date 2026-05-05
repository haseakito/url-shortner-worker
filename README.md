# URL Shortener on Cloudflare Workers

A fast, lightweight URL shortener built with Cloudflare Workers and KV storage. Features deduplication, collision handling, and security headers.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Overview

This URL shortener service allows you to create short, shareable links that redirect to longer URLs. Built on Cloudflare's edge infrastructure for global low-latency access.

## Architecture

```
┌─────────────┐     POST /shorten      ┌─────────────────┐
│   Client    │ ─────────────────────→ │  Cloudflare     │
│             │                        │  Worker         │
│             │ ←───────────────────── │  (Hono)         │
└─────────────┘  JSON {shortURL, key}  └────────┬────────┘
                                                │
                                                ↓
                                         ┌──────────────┐
                                         │  KV Storage  │
                                         │  key → url   │
                                         │  hash → key  │
                                         └──────────────┘
```

## Features

- **URL Shortening**: Convert long URLs to short 6-character keys
- **Deduplication**: Same URL returns the same short link (via SHA-512 hashing)
- **Collision Handling**: Automatic key regeneration on collision
- **Security**: CSRF protection, secure headers, AI bot blocking
- **Validation**: URL format validation using Valibot
- **Fast Redirects**: 302 redirects to original URLs

## API Endpoints

### POST /shorten

Create a shortened URL.

**Request:**

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/url"}'
```

**Response (201 Created):**

```json
{
  "success": true,
  "shortURL": "https://your-worker.your-subdomain.workers.dev/aB3dE5",
  "key": "aB3dE5"
}
```

**Response (existing URL):**

```json
{
  "success": true,
  "shortURL": "https://your-worker.your-subdomain.workers.dev/aB3dE5",
  "key": "aB3dE5"
}
```

### GET /:key

Redirect to the original URL.

**Example:**

```bash
curl -L https://your-worker.your-subdomain.workers.dev/api/aB3dE5
```

**Response:**

- `302 Found` - Redirects to original URL
- `404 Not Found` - Key does not exist

## Getting Started

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/haseakito/url-shortner-worker.git
   cd url-shortner-worker
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Create KV namespace:

   ```bash
   bunx wrangler kv namespace create "URL_SHORTENER"
   ```

4. Update `wrangler.jsonc` with your KV namespace ID:

   ```json
   "kv_namespaces": [
     {
       "binding": "URL_SHORTENER",
       "id": "your-kv-namespace-id"
     }
   ]
   ```

5. Deploy:
   ```bash
   bun run deploy
   ```

### Local Development

Run the worker locally:

```bash
bun run dev
```

## Environment Variables

Configure in `wrangler.jsonc`:

| Variable        | Description                                   |
| --------------- | --------------------------------------------- |
| `URL_SHORTENER` | KV namespace binding for storing URL mappings |

## Troubleshooting

### Worker deployment fails

- Check `wrangler.jsonc` configuration
- Verify Cloudflare Workers account permissions
- Ensure KV namespace is created and ID is correct

### KV operations failing

- Verify KV namespace binding name matches code (`URL_SHORTENER`)
- Check KV namespace ID in `wrangler.jsonc`

### Type errors

- Regenerate types: `bun run cf-typegen`
- Check TypeScript version compatibility

## License

MIT

## Author

[haseakito](https://github.com/haseakito)
