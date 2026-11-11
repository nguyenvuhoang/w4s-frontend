'use client'

import { EntityAuditHistoryView } from '@/shared/components/entity-audit/EntityAuditHistory'
import type { EntityAuditText } from '@/shared/components/entity-audit/EntityAuditHistory'

import { useResidentAuditHistory } from '../../hooks/useResidentAuditHistory'
import { residentText, type ResidentDictionary } from '../resident-list/residentListHelpers'

type Props = { dictionary: ResidentDictionary; locale: string; residentEntityId: number | null; active: boolean }

const AUDIT_FIELD_LABEL_KEYS: Record<string, string> = {
    Email: 'history_field_email', AvatarUrl: 'history_field_avatar_url', PhoneNumber: 'history_field_phone_number', FullName: 'history_field_full_name',
    DateOfBirth: 'history_field_date_of_birth', Gender: 'history_field_gender', Nationality: 'history_field_nationality', Description: 'history_field_description'
}

// Resident uses the shared change-history presentation with its own texts (resident.history_*) and field labels.
const ResidentHistoryTab = ({ dictionary, locale, residentEntityId, active }: Props) => {
    const { items, loading, error, reload } = useResidentAuditHistory({ entityId: residentEntityId, language: locale, enabled: active })
    const t: EntityAuditText = (key, fallback) => residentText(dictionary, key, key === 'history_created_fallback' ? 'Hồ sơ cư dân được khởi tạo' : fallback)
    const fieldLabel = (fieldName: string) => residentText(dictionary, AUDIT_FIELD_LABEL_KEYS[fieldName] ?? '', fieldName || '-')

    return <EntityAuditHistoryView
        title={residentText(dictionary, 'detail_tab_history', 'Lịch sử thao tác')}
        t={t}
        fieldLabel={fieldLabel}
        locale={locale}
        items={items}
        loading={loading}
        error={error}
        onReload={reload}
    />
}

export default ResidentHistoryTab
