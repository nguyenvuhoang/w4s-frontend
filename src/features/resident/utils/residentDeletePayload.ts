import type { ResidentDeleteRequest } from '../types'

export const buildResidentDeletePayload = (id: number): ResidentDeleteRequest => ({ id })
