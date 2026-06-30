/**
 * Thin HTTP client for the Knook backend adapter.
 *
 * In production this file is replaced by Firestore SDK calls; the function
 * surface is intentionally Firestore-ish (addCrush, listCrushes, etc.) so
 * the rest of the app can keep its imports.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = 'knook.token';
const UID_KEY = 'knook.uid';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setSession(token: string, uid: string) {
  await AsyncStorage.multiSet([[TOKEN_KEY, token], [UID_KEY, uid]]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, UID_KEY]);
}

export async function getUid(): Promise<string | null> {
  return AsyncStorage.getItem(UID_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = body?.detail || res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return body as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
