/**
 * Thin HTTP client for the Knook backend adapter.
 *
 * In production this file is replaced by Firestore SDK calls; the function
 * surface is intentionally Firestore-ish (addCrush, listCrushes, etc.) so
 * the rest of the app can keep its imports.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { diagnostics } from '@/src/utils/diagnostics';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = 'knook.token';
const UID_KEY = 'knook.uid';

type TokenResolver = (forceRefresh?: boolean) => Promise<string | null>;
type UidResolver = () => Promise<string | null>;

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUid(): Promise<string | null> {
  return AsyncStorage.getItem(UID_KEY);
}

let tokenResolver: TokenResolver = getStoredToken;
let uidResolver: UidResolver = getStoredUid;

export function setAccessTokenResolver(resolver: TokenResolver) {
  tokenResolver = resolver;
}

export function setUidResolver(resolver: UidResolver) {
  uidResolver = resolver;
}

export async function setSession(token: string | null, uid: string) {
  const operations: [string, string][] = [[UID_KEY, uid]];
  if (token) operations.push([TOKEN_KEY, token]);
  await AsyncStorage.multiSet(operations);
  if (!token) await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, UID_KEY]);
}

export async function getUid(): Promise<string | null> {
  return uidResolver();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await tokenResolver();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = init.method || 'GET';
  const url = `${BASE}/api${path}`;
  try {
    diagnostics.log('api-request', { method, path, hasBase: !!BASE });
    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    diagnostics.log('api-response', { method, path, status: res.status });
    if (!res.ok) {
      const detail = body?.detail || res.statusText;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    return body as T;
  } catch (error) {
    diagnostics.error('api-failure', error, { method, path, hasBase: !!BASE });
    if (!BASE) {
      throw new Error('Local backend URL is not configured');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Backend returned an invalid response');
    }
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Local backend is unavailable');
    }
    throw error;
  }
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
