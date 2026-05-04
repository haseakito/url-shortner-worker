export const randomString = (len: number = 6) => {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return Array.from({ length: len }, () => c.charAt(Math.floor(Math.random() * c.length))).join("");
};

export const sha512 = async (url: string) => {
  const encoded = new TextEncoder().encode(url);

  const digest = await crypto.subtle.digest("SHA-512", encoded);
  // convert buffer to byte array
  const hashArray = Array.from(new Uint8Array(digest));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
};
