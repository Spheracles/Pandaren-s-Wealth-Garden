/**
 * HTTPS client for the future cloud backend (auth, sync, AI proxy).
 * - Base URL comes from VITE_API_BASE_URL at build time; API keys are NEVER here.
 * - Every request has a timeout and returns a typed, user-readable error.
 * Until a backend is deployed this build is an internal test build and the
 * client reports `not-configured` instead of pretending to be connected.
 */
export type ApiError = { kind: 'not-configured' | 'offline' | 'timeout' | 'http' | 'network' | 'bad-response'; message: string; status?: number };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const apiConfigured = /^https:\/\//.test(BASE);
export const apiBase = BASE;

let token: string | null = null; // in-memory only; persisted by the auth module once the backend exists
export function setSessionToken(t: string | null) { token = t; }

export async function request<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<ApiResult<T>> {
  if (!apiConfigured) return { ok: false, error: { kind: 'not-configured', message: '尚未設定雲端服務（內部測試版僅在本機運作）。' } };
  if (!navigator.onLine) return { ok: false, error: { kind: 'offline', message: '目前離線。資料仍保存在本機，連線後再試。' } };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 15000);
  try {
    const res = await fetch(BASE + path, {
      ...init, signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) },
    });
    if (!res.ok) {
      const msg = res.status === 401 ? '登入已過期，請重新登入。' : res.status === 429 ? '請求太頻繁或已達 AI 用量上限，請稍後再試。' : res.status >= 500 ? '雲端服務暫時無法使用，請稍後再試。' : `請求失敗（${res.status}）。`;
      return { ok: false, error: { kind: 'http', status: res.status, message: msg } };
    }
    try { return { ok: true, data: (await res.json()) as T }; }
    catch { return { ok: false, error: { kind: 'bad-response', message: '伺服器回應格式不正確。' } }; }
  } catch (e: any) {
    if (e && e.name === 'AbortError') return { ok: false, error: { kind: 'timeout', message: '連線逾時，請檢查網路後再試。' } };
    return { ok: false, error: { kind: 'network', message: '無法連線到雲端服務。' } };
  } finally { clearTimeout(timer); }
}

export const checkHealth = () => request<{ status: string; version?: string }>('/health', { method: 'GET', timeoutMs: 8000 });
