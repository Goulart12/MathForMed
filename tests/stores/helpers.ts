/** Clears the in-memory `localStorage` stub between store tests. */
export function resetLocalStorage(): void {
  localStorage.clear()
}