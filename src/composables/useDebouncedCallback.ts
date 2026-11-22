import { onScopeDispose } from 'vue'

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayInMilliseconds: number,
) {
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel(): void {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function schedule(...args: TArgs): void {
    cancel()
    timer = setTimeout(() => {
      timer = null
      callback(...args)
    }, delayInMilliseconds)
  }

  function runNow(...args: TArgs): void {
    cancel()
    callback(...args)
  }

  onScopeDispose(cancel)
  return { schedule, runNow, cancel }
}
