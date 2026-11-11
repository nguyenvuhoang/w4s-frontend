// The audit helpers are generic (Resident, Project, Building, Floor) and live in shared/utils.
// Re-exported under the original names for the Resident module.
export {
    formatAuditDateTime as formatResidentAuditDateTime,
    getAuditActionPresentation,
    getAuditValueText,
    hasMalformedAuditChanges,
    parseAuditChanges,
    sortAuditItemsNewestFirst
} from '@/shared/utils/entityAuditHelpers'
export type { AuditChange } from '@/shared/utils/entityAuditHelpers'
