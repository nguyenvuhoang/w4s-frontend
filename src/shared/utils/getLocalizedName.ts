export const getLocalizedName = (jsonString: string | object | undefined, locale: string, fallback: string = ''): string => {
    if (!jsonString) return '';
    try {
        const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        if (parsed && typeof parsed === 'object') {
            return parsed[locale] || parsed['en'] || fallback;
        }
        return fallback;
    } catch (error) {
        return fallback;
    }
};
