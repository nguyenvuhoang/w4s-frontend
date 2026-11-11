import { signIn } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { LoginErrorPayload } from '@features/auth/types';

const FALLBACK_ERROR: LoginErrorPayload = {
    message: 'The server is temporarily unavailable. Please try again later!',
    error_code: 'SERVER_UNAVAILABLE',
    execution_id: null,
    type_error: 'danger'
};

// signIn() from next-auth wraps whatever `authorize()` throws inside an internal
// AuthError (e.g. CallbackRouteError), which moves the original message we set in
// auth.ts into `error.cause.err.message`. Unwrap it here so the real backend error
// (message/error_code/execution_id/type_error) reaches the client untouched, instead
// of being replaced by a generic "Unexpected authentication error." message.
const extractLoginError = (error: unknown): LoginErrorPayload => {
    const rawMessage = String(
        (error as any)?.cause?.err?.message
        ?? (error as any)?.message
        ?? ''
    );

    try {
        const parsed = JSON.parse(rawMessage);
        if (parsed && typeof parsed.message === 'string') {
            return {
                message: parsed.message,
                error_code: parsed.error_code ?? null,
                execution_id: parsed.execution_id ?? null,
                type_error: parsed.type_error ?? 'danger'
            };
        }
    } catch {
        // rawMessage wasn't a structured payload — fall through
    }

    if (rawMessage.trim()) {
        return {
            message: rawMessage,
            error_code: null,
            execution_id: null,
            type_error: 'danger'
        };
    }

    return FALLBACK_ERROR;
};

export async function POST(req: NextRequest) {
    const {
        username,
        password,
        my_device,
        language,
        realtoken,
        is_reset_device
    } = await req.json();

    const credentials = realtoken
        ? { realtoken, redirect: false }
        : { username, password, my_device, language, is_reset_device, redirect: false };

    try {
        const res = await signIn("credentials", credentials);

        if (!res || (res as any)?.error) {
            const loginError = (res as any)?.error
                ? extractLoginError({ message: (res as any).error })
                : FALLBACK_ERROR;

            return NextResponse.json({
                status: 401,
                error: loginError.message,
                error_code: loginError.error_code,
                execution_id: loginError.execution_id,
                type_error: loginError.type_error,
                ok: false,
                data: {}
            }, { status: 401 });
        }

        return NextResponse.json({
            status: 200,
            error: '',
            error_code: null,
            execution_id: null,
            type_error: null,
            ok: true,
            data: res
        }, { status: 200 });

    } catch (error) {
        const loginError = extractLoginError(error);
        const status = loginError.error_code === 'HAVELOGGED' ? 299 : 401;

        return NextResponse.json({
            status,
            error: loginError.message,
            error_code: loginError.error_code,
            execution_id: loginError.execution_id,
            type_error: loginError.type_error,
            ok: false,
            data: {}
        }, { status });
    }
}
