import { vi } from 'vitest'

/**
 * jsdom implements neither of these. `CalculatorView` scrolls on reset and calls
 * the Web Share API, so without the stubs every related test logs a noisy
 * "Not implemented" stack to stderr.
 */
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}
