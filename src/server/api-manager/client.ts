import { logoutClientSession } from '@/servers/lib/http';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''; // Relative path for internal

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}/api/api-manager${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!res.ok) {
        // Session invalid/expired: clear state and redirect to login through the same central
        // path every other API client uses (src/servers/lib/http.ts), instead of throwing a
        // generic error that callers would otherwise surface as their own toast/alert. The
        // returned promise never resolves so callers never get a chance to render that error.
        if (res.status === 401) {
            await logoutClientSession('authentication_error');

            return new Promise<T>(() => { });
        }

        // 403 is a business/permission error (not a session error) — surfaced to the caller as-is.
        if (res.status === 403) throw new Error('Forbidden');
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${res.statusText}`);
    }

    return res.json();
}

export const apiClient = {
    get: <T>(url: string) => fetchJson<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: any) => fetchJson<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(url: string, body: any) => fetchJson<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(url: string) => fetchJson<T>(url, { method: 'DELETE' }),
};
