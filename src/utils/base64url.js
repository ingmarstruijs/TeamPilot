/**
 * Safe JSON ↔ base64url helpers for share links.
 * Avoids `String.fromCharCode(...largeUint8Array)` which throws on big payloads
 * (e.g. training shares that embed custom SVG diagrams).
 */

const CHUNK = 0x8000

function bytesToBinaryString(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return out
}

export function encodeJson(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  return btoa(bytesToBinaryString(bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function decodeJson(encoded) {
  if (encoded == null || encoded === '') {
    throw new Error('Empty share payload')
  }
  const b64 = String(encoded).replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}
