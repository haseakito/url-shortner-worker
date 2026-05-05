import { env } from "cloudflare:workers";
import { describe, it, expect, beforeEach } from "vitest";
import app from "./index";
import type { URLShortenResponse } from "./types";

describe("URL Shortener Integration Tests", () => {
  beforeEach(async () => {
    const kv = env.URL_SHORTENER;
    const keys = await kv.list();
    for (const key of keys.keys) {
      await kv.delete(key.name);
    }
  });

  describe("POST /shorten", () => {
    it("should create a short URL for a valid URL", async () => {
      const request = new Request("http://localhost:8787/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const res = await app.fetch(request, env);

      expect(res.status).toBe(201);
      const body = (await res.json()) as URLShortenResponse;
      expect(body.success).toBe(true);
      expect(body.shortURL).toMatch(/^http:\/\/localhost:8787\/[a-zA-Z0-9_-]{6}$/);
      expect(body.key).toHaveLength(6);
    });

    it("should return existing short URL for duplicate URL", async () => {
      const url = "https://duplicate-test.com";

      const req1 = new Request("http://localhost:8787/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const res1 = await app.fetch(req1, env);

      const body1 = (await res1.json()) as URLShortenResponse;

      const req2 = new Request("http://localhost:8787/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const res2 = await app.fetch(req2, env);
      const body2 = (await res2.json()) as URLShortenResponse;

      expect(body1.key).toBe(body2.key);
      expect(body1.shortURL).toBe(body2.shortURL);
    });

    it("should return 400 for invalid URL", async () => {
      const request = new Request("http://localhost:8787/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "not-a-valid-url" }),
      });

      const res = await app.fetch(request, env);

      expect(res.status).toBe(400);
    });

    it("should return 400 for missing URL field", async () => {
      const request = new Request("http://localhost:8787/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await app.fetch(request, env);

      expect(res.status).toBe(400);
    });

    it("should handle URLs with special characters", async () => {
      const request = new Request("http://localhost:8787/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://example.com/path?query=value&foo=bar#section",
        }),
      });

      const res = await app.fetch(request, env);

      expect(res.status).toBe(201);
      const body = (await res.json()) as URLShortenResponse;
      expect(body.success).toBe(true);
    });
  });

  describe("GET /:key", () => {
    it("should redirect to original URL for existing key", async () => {
      const createRequest = new Request("http://localhost:8787/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://redirect-test.com" }),
      });

      const createResponse = await app.fetch(createRequest, env);

      const createBody = (await createResponse.json()) as URLShortenResponse;
      const key = createBody.key!;

      const request = new Request(`http://localhost:8787/api/${key}`, {
        method: "GET",
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("https://redirect-test.com");
    });

    it("should return 404 for non-existent key", async () => {
      const request = new Request("http://localhost:8787/api/nonexistent", {
        method: "GET",
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
      const body = (await response.json()) as URLShortenResponse;
      expect(body.success).toBe(false);
      expect(body.error).toBe("Short URL not found");
    });

    it("should handle multiple different URLs", async () => {
      const urls = ["https://example1.com", "https://example2.com", "https://example3.com"];

      const keys: string[] = [];

      for (const url of urls) {
        const request = new Request("http://localhost:8787/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const response = await app.fetch(request, env);
        const body = (await response.json()) as URLShortenResponse;
        keys.push(body.key!);
      }

      for (let i = 0; i < urls.length; i++) {
        const request = new Request(`http://localhost:8787/api/${keys[i]}`, {
          method: "GET",
        });

        const response = await app.fetch(request, env);

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe(urls[i]);
      }
    });
  });
});
