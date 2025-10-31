/// <reference types="vite/client" />
import crypto from "crypto";

export function generateCertHash(certData: object) {
  const hash = crypto.createHash("sha256")
    .update(JSON.stringify(certData))
    .digest("hex");
  console.log("Certification Hash:", hash);
  return hash;
}