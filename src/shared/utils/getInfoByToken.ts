import { jwtDecode } from 'jwt-decode'

type JwtPayload = {
    [key: string]: any
}

export const getInfoByToken = (token: string, key: string): any | null => {
    try {
        const decoded = jwtDecode<Record<string, any>>(token)
        return decoded[key] ?? null
    } catch {
        return null
    }
}
