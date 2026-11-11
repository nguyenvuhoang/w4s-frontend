import { ResidentRelationshipCode, ResidentRole } from '../types'

export const OWNER_ROLE: ResidentRole = 'OWNER'

const ROLE_RELATIONSHIP_MAP: Partial<Record<ResidentRole, ResidentRelationshipCode[]>> = {
    OWNER: ['OWNER'],
    MEMBER: ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'RELATIVE', 'OTHER'],
    TENANT: ['TENANT'],
    REPRESENTATIVE: ['AUTHORIZED_REPRESENTATIVE']
}

export const getAllowedRelationshipsByRole = (role: string): ResidentRelationshipCode[] => (
    ROLE_RELATIONSHIP_MAP[role as ResidentRole] ?? []
)

export const normalizeRelationshipByRole = (
    role: string,
    relationship?: string
): ResidentRelationshipCode | '' => {
    const allowedRelationships = getAllowedRelationshipsByRole(role)

    if (allowedRelationships.length === 0) return ''
    if (relationship && allowedRelationships.includes(relationship as ResidentRelationshipCode)) {
        return relationship as ResidentRelationshipCode
    }

    return allowedRelationships[0]
}

export const validateRoleRelationship = (role: string, relationship: string): string | null => {
    if (!role || !relationship) return null

    if (role === OWNER_ROLE && relationship !== OWNER_ROLE) {
        return 'validation_owner_role_requires_owner_relationship'
    }

    if (role !== OWNER_ROLE && relationship === OWNER_ROLE) {
        return 'validation_non_owner_role_cannot_use_owner_relationship'
    }

    const allowedRelationships = getAllowedRelationshipsByRole(role)

    if (allowedRelationships.length > 0 && !allowedRelationships.includes(relationship as ResidentRelationshipCode)) {
        return 'validation_invalid_role_relationship_mapping'
    }

    return null
}
