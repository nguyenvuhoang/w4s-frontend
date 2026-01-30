export function mappingErrorCode(errorString: string) {
    const parts = errorString.split(": ");

    // Return the second part, which is the error message, or an empty string if not found
    return parts.length > 1 ? parts[1].trim() : '';
}
