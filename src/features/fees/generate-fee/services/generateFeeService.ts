import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { apartmentLookupService } from '@/shared/services/apartmentLookupService'

import { feeService } from '../../service'
import type {
    GenerateFeeSubmitPayload,
    GenerateFeeSubmitResult
} from '../types'

export type GenerateFeeTypeLookupResult = {
    found: Map<string, string>
    notFound: Set<string>
}

type GenerateFeeServiceOptions = {
    sessiontoken?: string
    language?: Locale | string
    /** Project code from the active IPS Project Context; sent as the established `scope` header. */
    projectCode?: string
}

const GENERATE_FEE_FILE_VALIDATE_PATH = '/api/fees/import-validate'

export class GenerateFeeFileValidationError extends Error {
    status: number
    executionId: string | null

    constructor(message: string, status: number, executionId: string | null = null) {
        super(message)
        this.name = 'GenerateFeeFileValidationError'
        this.status = status
        this.executionId = executionId
    }
}

/**
 * Best-effort extraction of a human message out of whatever shape the proxy/backend returned.
 * The real backend (ValidateFeeExcelImportCommandHandler) reports business failures as
 * { success: false, status: "ERROR", error_code, error_message, description, execution_id },
 * with no `message`/`errors[]` envelope — error_message/error_code carry the actual reason
 * ("ProjectId is required."), `description` is just a generic "Unhandled exception occurred".
 */
const extractBackendValidationMessage = (payload: any, fallback: string): string => {
    const message = payload?.error_message
        ?? payload?.errorMessage
        ?? payload?.errors?.[0]?.info
        ?? payload?.errors?.[0]?.message
        ?? payload?.error_code
        ?? payload?.errorCode
        ?? payload?.message
        ?? payload?.data?.message
        ?? payload?.description

    return typeof message === 'string' && message.trim() ? message.trim() : fallback
}

const extractBackendExecutionId = (payload: any): string | null => {
    const executionId = payload?.execution_id ?? payload?.executionId ?? payload?.data?.execution_id

    return typeof executionId === 'string' && executionId.trim() ? executionId.trim() : null
}

const GENERATE_FEE_IMPORT_PATH = '/api/fees/import'

export class GenerateFeeSubmitError extends Error {
    execution_id: string | null

    constructor(message: string, execution_id: string | null = null) {
        super(message)
        this.name = 'GenerateFeeSubmitError'
        this.execution_id = execution_id
    }
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
    }

    const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
        acc[normalizeKey(key)] = item[key]

        return acc
    }, {})

    for (const key of keys) {
        const value = normalizedMap[normalizeKey(key)]

        if (value !== undefined && value !== null) return value
    }

    return undefined
}

const toNullableNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

export const generateFeeService = {
    /**
     * Uploads the Excel file to the fee import validation proxy (/api/fees/import-validate ->
     * ips/api/feeexcelimport/validate) together with the current project id, and returns the raw
     * backend payload as-is — mapping into GenerateFeeValidationSummary happens in
     * generateFeeBackendMapper so this stays a thin, testable network call.
     */
    validateGenerateFeeFile: async (
        file: File,
        options: GenerateFeeServiceOptions & { projectId: number; requestFailedMessage: string }
    ): Promise<unknown> => {
        const formData = new FormData()

        formData.append('File', file)
        // The backend DTO binds this as `ProjectId` (PascalCase) — a plain-lowercased match isn't
        // enough because "project_id" and "ProjectId" differ by the underscore, not just case.
        formData.append('ProjectId', String(options.projectId))

        const headers: Record<string, string> = {
            app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
        }

        if (options.sessiontoken) headers.uid = options.sessiontoken
        if (options.language) headers.lang = String(options.language)
        if (options.projectCode) headers.scope = options.projectCode

        const response = await fetch(GENERATE_FEE_FILE_VALIDATE_PATH, {
            method: 'POST',
            headers,
            body: formData
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok || payload?.success === false) {
            throw new GenerateFeeFileValidationError(
                extractBackendValidationMessage(payload, options.requestFailedMessage),
                response.status,
                extractBackendExecutionId(payload)
            )
        }

        return payload
    },

    /**
     * Checks each distinct apartment code from the import against the current project via the
     * shared apartment lookup workflow (reused as-is, no new workflow added). Returns the set of
     * codes that do NOT exist in the project, uppercased, for the caller to flag on the matching rows.
     */
    findInvalidApartmentCodes: async ({
        sessiontoken,
        language,
        projectId,
        apartmentCodes
    }: {
        sessiontoken?: string
        language?: Locale | string
        projectId: number
        apartmentCodes: string[]
    }): Promise<Set<string>> => {
        const distinctCodes = Array.from(
            new Set(apartmentCodes.map(code => code.trim().toUpperCase()).filter(Boolean))
        )

        if (distinctCodes.length === 0 || !sessiontoken || !Number.isInteger(projectId) || projectId <= 0) {
            return new Set()
        }

        const results = await Promise.all(distinctCodes.map(async code => {
            try {
                const result = await apartmentLookupService.searchApartments({
                    sessiontoken,
                    language,
                    projectId,
                    filter: { apartment_code: code, apartment_type: '', page_index: 0, page_size: 5 }
                })

                const found = result.items.some(item => item.code.trim().toUpperCase() === code)

                return { code, found }
            } catch {
                // A lookup failure (network/backend) must not silently flag a code as invalid —
                // leave it to whatever field-level validation already decided for the row.
                return { code, found: true }
            }
        }))

        return new Set(results.filter(item => !item.found).map(item => item.code))
    },

    /**
     * Looks up each distinct bill-number prefix (fee type code) against the real Fee Type
     * Management catalog (the same search used by /fees/fee-type) — the customer's file no
     * longer ships a Master Data sheet, so this is now the only "system data" source for fee
     * type names. A code that queries successfully but has no match is reported in `notFound` so
     * the caller can warn on the row; a code whose lookup itself failed (network/backend) is left
     * out of both sets so a transient error never gets reported as "fee type not found".
     */
    findFeeTypeNames: async ({
        sessiontoken,
        language,
        codes
    }: {
        sessiontoken?: string
        language?: Locale | string
        codes: string[]
    }): Promise<GenerateFeeTypeLookupResult> => {
        const distinctCodes = Array.from(
            new Set(codes.map(code => code.trim().toUpperCase()).filter(Boolean))
        )

        const found = new Map<string, string>()
        const notFound = new Set<string>()

        if (distinctCodes.length === 0 || !sessiontoken) {
            return { found, notFound }
        }

        await Promise.all(distinctCodes.map(async code => {
            try {
                const result = await feeService.simpleSearchFeeTypes({
                    sessiontoken,
                    language: language as Locale,
                    filter: { search_text: code, page_index: 1, page_size: 5 }
                })

                const match = result.items.find(item => item.fee_type_code.trim().toUpperCase() === code)

                if (match) {
                    found.set(code, match.name.trim() || match.fee_type_code)
                } else {
                    notFound.add(code)
                }
            } catch {
                // ignore — see doc comment above
            }
        }))

        return { found, notFound }
    },

    /**
     * Commits the already-validated fee invoice list via POST /api/fees/import
     * (-> ips/api/fee-invoices/import) — a direct REST call, body sent exactly as
     * `{ project_id, file_name, notes, duplicate_policy, items }`, no workflowid/fields envelope.
     * `payload.items` is expected to be the validate response's own raw detail items (or, for the
     * pasted-table path, GenerateFeeRequestItem[] built from the parsed rows) — see
     * GenerateFeeImportPage.tsx for how the caller builds this list from `raw_items`/`rows`.
     */
    submitGenerateFee: async (
        payload: GenerateFeeSubmitPayload,
        options: GenerateFeeServiceOptions & { requestFailedMessage: string }
    ): Promise<GenerateFeeSubmitResult> => {
        const headers: Record<string, string> = {
            'content-type': 'application/json',
            app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
        }

        if (options.sessiontoken) headers.uid = options.sessiontoken
        if (options.language) headers.lang = String(options.language)
        if (options.projectCode) headers.scope = options.projectCode

        const response = await fetch(GENERATE_FEE_IMPORT_PATH, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        })

        const responsePayload = await response.json().catch(() => null)

        if (!response.ok || responsePayload?.success === false) {
            throw new GenerateFeeSubmitError(
                extractBackendValidationMessage(responsePayload, options.requestFailedMessage),
                extractBackendExecutionId(responsePayload)
            )
        }

        const root = responsePayload?.data ?? responsePayload

        return {
            total_count: toNullableNumber(getField(root, ['total_count', 'totalCount'])),
            created_count: toNullableNumber(getField(root, ['created_count', 'createdCount', 'inserted_count', 'insertedCount'])),
            updated_count: toNullableNumber(getField(root, ['updated_count', 'updatedCount'])),
            skipped_count: toNullableNumber(getField(root, ['skipped_count', 'skippedCount', 'duplicate_count', 'duplicateCount'])),
            error_count: toNullableNumber(getField(root, ['error_count', 'errorCount', 'failed_count', 'failedCount'])),
            execution_id: extractBackendExecutionId(responsePayload)
        }
    }
}
