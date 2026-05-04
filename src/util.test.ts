import { describe, it, expect } from "vitest";
import { randomString, sha512 } from "./util";

describe("randomString", () => {
  it("should generate a string of default length 6", () => {
    const result = randomString();
    expect(result).toHaveLength(6);
  });

  it("should generate a string of specified length", () => {
    const result = randomString(10);
    expect(result).toHaveLength(10);
  });

  it("should only contain valid characters", () => {
    const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const result = randomString(100);

    for (const char of result) {
      expect(validChars).toContain(char);
    }
  });

  it("should generate different strings on multiple calls", () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(randomString());
    }
    // With 64^6 possible combinations, collisions are extremely unlikely
    expect(results.size).toBe(100);
  });

  it("should handle length 0", () => {
    const result = randomString(0);
    expect(result).toHaveLength(0);
    expect(result).toBe("");
  });
});

describe("sha512", () => {
  it("should generate a 128-character hex string for a URL", async () => {
    const hash = await sha512("https://example.com");
    expect(hash).toHaveLength(128);
  });

  it("should generate consistent hash for the same input", async () => {
    const url = "https://example.com/path?query=1";
    const hash1 = await sha512(url);
    const hash2 = await sha512(url);
    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different inputs", async () => {
    const hash1 = await sha512("https://example.com");
    const hash2 = await sha512("https://example.org");
    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty string", async () => {
    const hash = await sha512("");
    expect(hash).toHaveLength(128);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("should handle very long URLs", async () => {
    const longUrl = "https://example.com/" + "a".repeat(1000);
    const hash = await sha512(longUrl);
    expect(hash).toHaveLength(128);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("should handle URLs with special characters", async () => {
    const url = "https://example.com/path?key=value&foo=bar#section";
    const hash = await sha512(url);
    expect(hash).toHaveLength(128);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("should generate only lowercase hexadecimal characters", async () => {
    const hash = await sha512("https://example.com");
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("should handle unicode characters", async () => {
    const url = "https://example.com/日本語";
    const hash = await sha512(url);
    expect(hash).toHaveLength(128);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});
