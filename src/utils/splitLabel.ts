export function splitLabel(input: string): string {
    if (!input) return '';

    return input
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[_\-]+/g, ' ')
        .replace(/([a-z]+)(\d+)/gi, '$1 $2') 
        .replace(/([a-z]{2,})(?=[A-Z])/g, (match) => {
            return match[0].toUpperCase() + match.slice(1);
        })
        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
        .trim();
}
