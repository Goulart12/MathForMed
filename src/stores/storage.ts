/**
 * Defensive wrappers around `localStorage`.
 *
 * `localStorage` is absent in Node and in server-rendered contexts, and can
 * throw on access when cookies are blocked, so every access is guarded. The
 * stores fall back to in-memory behaviour rather than crashing.
 *
 * @module stores/storage
 */

/** Whether a usable `localStorage` is available in this runtime. */
export const hasStorage = (): boolean => {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null
  } catch {
    return false
  }
}

/**
 * Reads and JSON-parses a key.
 *
 * @param key - `localStorage` key.
 * @returns The parsed value, or `null` when absent, unparseable or storage is
 *   unavailable.
 */
export function readStorage<T>(key: string): T | null {
  if (!hasStorage()) return null

  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

/**
 * JSON-serialises and writes a key.
 *
 * @param key - `localStorage` key.
 * @param value - Value to persist.
 */
export function writeStorage(key: string, value: unknown): void {
  if (!hasStorage()) return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage blocked: persistence is best-effort.
  }
}

/**
 * Removes a key.
 *
 * @param key - `localStorage` key.
 */
export function removeStorage(key: string): void {
  if (!hasStorage()) return

  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore: nothing actionable.
  }
}

/**
 * Generates a UUID, preferring `crypto.randomUUID` and falling back to
 * `crypto.getRandomValues` for older runtimes.
 */
export function randomId(): string {
  const webCrypto = globalThis.crypto

  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID()
  }

  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    const bytes = webCrypto.getRandomValues(new Uint8Array(16))
    // RFC 4122 version 4 layout.
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}