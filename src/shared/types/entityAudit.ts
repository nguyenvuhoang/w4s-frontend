/**
 * Entities whose change history can be read through POST /ips/api/entity-audit/get.
 * `entity_name` must be the exact Backend entity/table name (the Tower screens use "Building").
 * The BFF only forwards names from this list, so the browser cannot query arbitrary entities.
 */
export const ENTITY_AUDIT_ENTITY_NAMES = ['Resident', 'Project', 'Building', 'Floor', 'Apartment'] as const

export type EntityAuditEntityName = (typeof ENTITY_AUDIT_ENTITY_NAMES)[number]

export const isEntityAuditEntityName = (value: unknown): value is EntityAuditEntityName => (
  typeof value === 'string' && (ENTITY_AUDIT_ENTITY_NAMES as readonly string[]).includes(value)
)

export type EntityAuditItem = {
  id: number
  entity_name: string
  entity_id: number
  user_id: string
  /** Display name of the actor ("Người thực hiện"); "" when the Backend sends null/empty. */
  user_name: string
  execution_id: string
  action_type: string
  /** JSON array of { FieldName, OldValue, NewValue, Delta }. */
  changes: string
  created_on_utc: string | null
  updated_on_utc: string | null
}
