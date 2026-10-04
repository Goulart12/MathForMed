import { afterEach, describe, expect, it } from 'vitest'
import {
  hasStorage,
  randomId,
  readStorage,
  removeStorage,
  writeStorage,
} from '@/stores/storage'

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

/** Restores a working in-memory `localStorage` stub. */
function reinstall(): void {
  if (original) Object.defineProperty(globalThis, 'localStorage', original)
}

describe('storage wrappers', () => {
  afterEach(reinstall)

  it('reports storage availability', () => {
    expect(hasStorage()).toBe(true)
  })

  it('round-trips a value', () => {
    writeStorage('k', { a: 1 })
    expect(readStorage<{ a: number }>('k')).toEqual({ a: 1 })
  })

  it('round-trips an array', () => {
    writeStorage('ids', ['imc', 'sofa'])
    expect(readStorage<string[]>('ids')).toEqual(['imc', 'sofa'])
  })

  it('returns null for an absent key', () => {
    expect(readStorage('missing')).toBeNull()
  })

  it('returns null for unparseable JSON', () => {
    localStorage.setItem('bad', 'not json')
    expect(readStorage('bad')).toBeNull()
  })

  it('removes a key', () => {
    writeStorage('gone', 1)
    removeStorage('gone')
    expect(readStorage('gone')).toBeNull()
  })

  it('removing an absent key is a no-op', () => {
    expect(() => removeStorage('never-set')).not.toThrow()
  })
})

describe('storage wrappers without localStorage', () => {
  afterEach(reinstall)

  it('degrades gracefully when storage is undefined', () => {
    Reflect.deleteProperty(globalThis, 'localStorage')
    expect(hasStorage()).toBe(false)
    expect(readStorage('k')).toBeNull()
    expect(() => writeStorage('k', 1)).not.toThrow()
    expect(() => removeStorage('k')).not.toThrow()
  })

  it('degrades gracefully when access to storage throws', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new Error('cookies blocked')
      },
      configurable: true,
    })

    expect(hasStorage()).toBe(false)
    expect(readStorage('k')).toBeNull()
    expect(() => writeStorage('k', 1)).not.toThrow()
    expect(() => removeStorage('k')).not.toThrow()
  })
})

describe('storage wrappers when operations throw', () => {
  afterEach(reinstall)

  it('swallows getItem, setItem and removeItem failures', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('quota exceeded')
        },
        removeItem: () => {
          throw new Error('blocked')
        },
      },
      configurable: true,
    })

    expect(hasStorage()).toBe(true)
    expect(readStorage('k')).toBeNull()
    expect(() => writeStorage('k', 1)).not.toThrow()
    expect(() => removeStorage('k')).not.toThrow()
  })
})

describe('randomId', () => {
  const cryptoOriginal = Object.getOwnPropertyDescriptor(globalThis, 'crypto')

  afterEach(() => {
    if (cryptoOriginal) Object.defineProperty(globalThis, 'crypto', cryptoOriginal)
  })

  it('produces distinct RFC 4122 v4 identifiers', () => {
    const ids = new Set(Array.from({ length: 200 }, () => randomId()))
    expect(ids.size).toBe(200)
    expect(randomId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('falls back to getRandomValues when randomUUID is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues: (arr: Uint8Array) => arr.fill(7) },
      configurable: true,
    })

    expect(randomId()).toBe('07070707-0707-4707-8707-070707070707')
  })

  it('falls back to a timestamp when crypto is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true })
    expect(randomId()).toMatch(/^id-/)
  })
})