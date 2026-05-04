import * as v from "valibot";

export const URLShortenRequestSchema = v.object({
  url: v.pipe(v.string(), v.url()),
});

export type URLShortenRequest = v.InferOutput<typeof URLShortenRequestSchema>;

export const URLShortenResponseSchema = v.object({
  success: v.boolean(),
  shortURL: v.optional(v.string()),
  key: v.optional(v.string()),
  error: v.optional(v.string()),
});

export type URLShortenResponse = v.InferOutput<typeof URLShortenResponseSchema>;
