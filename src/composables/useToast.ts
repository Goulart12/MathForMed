/**
 * Minimal toast bus. Module-level state on purpose: any view can raise a toast
 * without the caller holding a reference, which keeps `CalculatorView`'s
 * post-calculation side effects to a single call.
 */
import { ref } from 'vue'

export type ToastTone = 'info' | 'ok' | 'alert'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const AUTO_DISMISS_MS = 2000

const toasts = ref<Toast[]>([])
let nextId = 1

const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function useToast() {
  function show(message: string, tone: ToastTone = 'info', duration = AUTO_DISMISS_MS) {
    const id = nextId++
    toasts.value.push({ id, message, tone })
    timers.set(
      id,
      setTimeout(() => dismiss(id), duration),
    )
    return id
  }

  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  return { toasts, show, dismiss }
}
