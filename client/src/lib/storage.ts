/**
 * localStorage の安全なラッパー
 * private browsing やストレージ無効時に例外を投げないようにする
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage full or unavailable
  }
}
