// Keep last 5 digits like the screenshot (xxxxxxxxx79754)
export const maskAccount = (value: string) => {
    if (!value) return 'xxxxxxxxx00000'
    const last = value.slice(-5)
    return `xxxxxxxxx${last}`
}
