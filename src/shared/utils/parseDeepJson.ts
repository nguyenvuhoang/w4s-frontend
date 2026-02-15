export const parseDeepJson = (v: any): any => {
    if (v == null) return v;

    if (typeof v === 'string') {
        const trimmed = v.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                const parsed = JSON.parse(trimmed);
                // Recursively parse the result in case it's still a string or contains strings
                return parseDeepJson(parsed);
            } catch {
                return v;
            }
        }
        return v;
    }

    if (typeof v === 'object') {
        if (Array.isArray(v)) {
            return v.map(parseDeepJson);
        }

        const result: any = {};
        for (const key in v) {
            if (Object.prototype.hasOwnProperty.call(v, key)) {
                result[key] = parseDeepJson(v[key]);
            }
        }
        return result;
    }

    return v;
};
