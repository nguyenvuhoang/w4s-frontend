/**
 * Convert a string from camelCase to snake_case
 */
export const camelToSnakeCase = (str: string): string => {
    return str
        .replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)
        .replace(/^_/, ''); // Remove leading underscore if present
};

/**
 * Convert object keys from camelCase to snake_case recursively
 */
export const convertKeysToSnakeCase = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeysToSnakeCase(item));
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    const snakeCaseObj: Record<string, any> = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const snakeKey = camelToSnakeCase(key);
            const value = obj[key];

            // Recursively convert nested objects
            snakeCaseObj[snakeKey] = typeof value === 'object' ? convertKeysToSnakeCase(value) : value;
        }
    }

    return snakeCaseObj;
};
