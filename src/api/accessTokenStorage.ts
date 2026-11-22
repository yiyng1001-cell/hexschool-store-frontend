const ACCESS_TOKEN_KEY = 'accessToken'

export interface AccessTokenStorage {
  read(): string | null
  write(token: string): void
  clear(): void
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function warnStorageUnavailable(operation: string, error: unknown): void {
  // Never log the token itself (constitution S-2).
  console.warn('access_token_storage.unavailable', { operation, error })
}

export function createAccessTokenStorage(storage: StorageLike | null): AccessTokenStorage {
  return {
    read() {
      if (storage === null) return null
      try {
        return storage.getItem(ACCESS_TOKEN_KEY)
      } catch (error) {
        warnStorageUnavailable('read', error)
        return null
      }
    },
    write(token) {
      if (storage === null) return
      try {
        storage.setItem(ACCESS_TOKEN_KEY, token)
      } catch (error) {
        warnStorageUnavailable('write', error)
      }
    },
    clear() {
      if (storage === null) return
      try {
        storage.removeItem(ACCESS_TOKEN_KEY)
      } catch (error) {
        warnStorageUnavailable('clear', error)
      }
    },
  }
}

function pickBrowserLocalStorage(): StorageLike | null {
  try {
    return window.localStorage
  } catch (error) {
    warnStorageUnavailable('access', error)
    return null
  }
}

export const accessTokenStorage = createAccessTokenStorage(pickBrowserLocalStorage())
