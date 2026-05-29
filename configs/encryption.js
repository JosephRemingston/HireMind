import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const KEY = Buffer.from(process.env.DB_ENCRYPTION_KEY, "base64");

console.log("Decoded key byte length:", KEY.length);

if (KEY.length !== 32) {
  throw new Error("Encryption key must be 32 bytes for AES-256");
}


function encryptString(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encryptedText: encrypted,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

function decryptString(encryptedObj) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedObj.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encryptedObj.authTag, "hex"));

  let decrypted = decipher.update(encryptedObj.encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export { encryptString, decryptString };