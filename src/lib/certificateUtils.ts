/// <reference types="vite/client" />

/**
 * Generate SHA-256 hash for certificate data using Web Crypto API (browser-compatible)
 */
export async function generateCertHash(certData: object): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(certData));

  // Use Web Crypto API (available in all modern browsers)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  console.log("Certification Hash:", hash);
  return hash;
}