export const parseMaybeJson = <T = any>(v: unknown): T | undefined => {
    if (v == null) return undefined;
    if (typeof v === 'string') {
        try { return JSON.parse(v) as T; } catch { return undefined; }
    }
    if (typeof v === 'object') return v as T;
    return undefined;
};
