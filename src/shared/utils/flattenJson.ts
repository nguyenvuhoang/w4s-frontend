export function flattenJson(obj: any, parentKey = '', out: Record<string, string> = {}): Record<string, string> {
    if (!obj || typeof obj !== 'object') return out;
    for (const [k, v] of Object.entries(obj)) {
        const key = parentKey ? `${parentKey}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            flattenJson(v, key, out);
        } else {
            out[key] = v as any as string;
        }
    }
    return out;
}
