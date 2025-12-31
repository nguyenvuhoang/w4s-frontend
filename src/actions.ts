'use server';
import { signIn } from "@/auth";

export async function authenticate(
    username?: string,
    password?: string,
    my_device?: string,
    language?: string,
    realtoken?: string,
    is_reset_device?: boolean
) {
    const credentials = realtoken
        ? { realtoken, redirect: false }
        : { username, password, my_device, language, is_reset_device, redirect: false };

    try {
        const res = await signIn("credentials", credentials);

        if (!res || (res as any)?.error) {
            return {
                status: 401,
                statusText: 'Unauthorized',
                error: 'Login failed. Please check your credentials.',
                ok: false,
                data: {}
            };
        }

        return {
            status: 200,
            statusText: 'OK',
            data: res,
            error: '',
            ok: true
        };
    } catch {
        return {
            status: 500,
            statusText: 'Internal Server Error',
            error: 'Unexpected authentication error.',
            ok: false,
            data: {}
        };
    }
}
