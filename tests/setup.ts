import { afterEach, vi } from 'vitest'

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

/**
 * Fails the test that caused a `console.error` or an unhandled rejection.
 *
 * Both are silent in CI otherwise: a swallowed validation error or a rejected
 * dynamic import inside `CalculatorView`'s async `handleCalculate` would leave
 * the suite green while the browser logged an error. Warnings are left alone —
 * `console.warn` is a deliberate channel for the design layer's dev hints.
 */
const noise: string[] = []

const originalError = console.error
console.error = (...args: unknown[]) => {
  noise.push(args.map(String).join(' '))
  originalError(...args)
}

function recordRejection(event: PromiseRejectionEvent): void {
  noise.push(`unhandledrejection: ${String(event.reason)}`)
}

function recordUncaught(event: ErrorEvent): void {
  noise.push(`uncaught: ${event.message}`)
}

window.addEventListener('unhandledrejection', recordRejection)
window.addEventListener('error', recordUncaught)

afterEach(() => {
  if (noise.length > 0) {
    const reported = [...new Set(noise)]
    noise.length = 0
    throw new Error(`console.error or unhandled rejection during the test:\n${reported.join('\n')}`)
  }
  noise.length = 0
})
