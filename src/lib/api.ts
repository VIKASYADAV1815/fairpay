/**
 * Backend API scaffold — replace BASE_URL when server is live.
 * All methods are stubs so UI can call them safely today.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.fairpay.app';

export type ApiError = { error: string };

async function request<T>(path: string, init?: RequestInit): Promise<T | ApiError> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    return (await res.json()) as T;
  } catch {
    return { error: 'offline' };
  }
}

export const api = {
  /** Auth */
  login: (email: string, password: string) =>
    request<{ token: string; name: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (name: string, email: string, password: string) =>
    request<{ token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  /** Groups / invites */
  createInvite: (groupId: string) =>
    request<{ code: string }>(`/groups/${groupId}/invite`, { method: 'POST' }),
  joinInvite: (code: string) =>
    request<{ groupId: string }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  /** Sync */
  pushGroups: (payload: unknown) =>
    request<{ ok: true }>('/sync/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  pullGroups: () => request<{ groups: unknown[] }>('/sync/groups'),
};
