import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { vValidator } from "@hono/valibot-validator";
import { URLShortenRequestSchema } from "./types";
import { uaBlocker } from "@hono/ua-blocker";
import { aiBots } from "@hono/ua-blocker/ai-bots";
import { randomString, sha512 } from "./util";
import { errorHandler, notFoundHandler } from "./middleware";

type Bindings = {
  URL_SHORTENER: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(csrf());
app.use(logger());
app.use(requestId());
app.use(secureHeaders());
app.use(uaBlocker({ blocklist: aiBots }));

app.onError(errorHandler);
app.notFound(notFoundHandler);

app
  .basePath("/api")
  .post("/shorten", vValidator("json", URLShortenRequestSchema), async (c) => {
    const { url } = c.req.valid("json");

    try {
      const hash = await sha512(url);

      // Check if URL already exists (deduplication)
      const existingKey = await c.env.URL_SHORTENER.get(`hash:${hash}`);
      if (existingKey) {
        const shortURL = `${new URL(c.req.url).origin}/${existingKey}`;
        return c.json({
          success: true,
          shortURL,
          key: existingKey,
        });
      }

      // Generate unique key
      let key = randomString();
      let attempts = 0;
      const maxAttempts = 10;

      while (await c.env.URL_SHORTENER.get(key)) {
        key = randomString();
        attempts++;
        if (attempts >= maxAttempts) {
          return c.json({ success: false, error: "Failed to generate unique key" }, 500);
        }
      }

      // Store mappings in KV
      // key -> url (for redirect lookup)
      // hash:key -> key (for deduplication)
      await c.env.URL_SHORTENER.put(key, url);
      await c.env.URL_SHORTENER.put(`hash:${hash}`, key);

      const shortURL = `${new URL(c.req.url).origin}/${key}`;

      return c.json(
        {
          success: true,
          shortURL,
          key,
        },
        201,
      );
    } catch (error) {
      console.error("Error shortening URL:", error);
      return c.json({ success: false, error: "Failed to shorten URL" }, 500);
    }
  })
  .get("/:key", async (c) => {
    const key = c.req.param("key");

    try {
      const originalUrl = await c.env.URL_SHORTENER.get(key);

      if (!originalUrl) {
        return c.json({ success: false, error: "Short URL not found" }, 404);
      }

      return c.redirect(originalUrl, 302);
    } catch (error) {
      console.error("Error retrieving URL:", error);
      return c.json({ success: false, error: "Failed to retrieve URL" }, 500);
    }
  });

export default app;
