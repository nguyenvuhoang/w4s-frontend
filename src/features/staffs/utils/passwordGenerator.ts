const UPPER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER_CHARS = 'abcdefghijklmnopqrstuvwxyz'
const DIGIT_CHARS = '0123456789'
const SPECIAL_CHARS = '!@#$%^&*()-_=+[]{}'
const ALL_CHARS = UPPER_CHARS + LOWER_CHARS + DIGIT_CHARS + SPECIAL_CHARS

const GENERATED_PASSWORD_LENGTH = 16

// Uniform, unbiased random index in [0, max) via rejection sampling over crypto.getRandomValues
// (max <= 256, so a single random byte per draw is enough) — no Math.random anywhere in this file.
const getRandomInt = (max: number) => {
    const limit = 256 - (256 % max)
    let byte = 0

    do {
        byte = crypto.getRandomValues(new Uint8Array(1))[0]
    } while (byte >= limit)

    return byte % max
}

const pickRandomChar = (chars: string) => chars[getRandomInt(chars.length)]

// Generates a strong password (>= 12 chars, here 16) that always contains at least one
// uppercase, lowercase, digit and special character, then shuffles so the guaranteed
// characters aren't always in the same leading positions.
export const generateStrongPassword = (length = GENERATED_PASSWORD_LENGTH): string => {
    const required_chars = [
        pickRandomChar(UPPER_CHARS),
        pickRandomChar(LOWER_CHARS),
        pickRandomChar(DIGIT_CHARS),
        pickRandomChar(SPECIAL_CHARS)
    ]

    const remaining_length = Math.max(length, required_chars.length) - required_chars.length
    const remaining_chars = Array.from({ length: remaining_length }, () => pickRandomChar(ALL_CHARS))
    const chars = [...required_chars, ...remaining_chars]

    for (let i = chars.length - 1; i > 0; i -= 1) {
        const j = getRandomInt(i + 1)

        ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }

    return chars.join('')
}
