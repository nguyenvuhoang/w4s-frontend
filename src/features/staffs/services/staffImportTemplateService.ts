const STAFF_IMPORT_TEMPLATE_PATH = '/api/users/import-template'
const STAFF_IMPORT_VALIDATE_PATH = '/api/users/import-validate'
const STAFF_IMPORT_PATH = '/api/users/import'

const parseContentDispositionFilename = (contentDisposition: string | null) => {
    if (!contentDisposition) return ''

    const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]

    if (encodedFilename) {
        try {
            return decodeURIComponent(encodedFilename)
        } catch {
            return encodedFilename
        }
    }

    return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]?.trim() ?? ''
}

const getErrorMessage = async (response: Response, fallback = 'Không thể tải file mẫu import nhân viên.') => {
    const payload = await response.clone().json().catch(() => null)
    const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse ?? payload
    const firstError = Array.isArray(dataresponse?.errors) ? dataresponse.errors[0] : undefined

    if (payload) {
        return String(
            payload.message
            ?? payload.error
            ?? dataresponse?.message
            ?? firstError?.info
            ?? firstError?.message
            ?? fallback
        )
    }

    return (await response.text().catch(() => '')).trim() || fallback
}

export type StaffImportTemplateResponse = {
    blob: Blob
    filename: string
}

export type StaffImportValidationResult = {
    file_name: string
    total_rows: number | null
    valid_rows: number | null
    error_rows: number | null
    /** Valid rows whose action is Create. Prefer this over recounting rows on the client. */
    create_count: number | null
    /** Valid rows whose action is Update. Prefer this over recounting rows on the client. */
    update_count: number | null
    rows: StaffImportValidationRow[]
    /** Raw, normalized users supplied by validation. This is forwarded to import unchanged. */
    users: Record<string, unknown>[]
}

export type StaffImportValidationRow = {
    row_number: string
    action: string
    status: string
    user_name: string
    last_name: string
    middle_name: string
    first_name: string
    full_name: string
    phone: string
    email: string
    identity_number: string
    role_codes: string
    project_codes: string
    errors: string[]
    warnings: string[]
    user_match: 'FOUND' | 'NOT_FOUND' | ''
    changes: string[]
    /** The normalized backend payload; this is the only allowed source for the future import workflow. */
    data: Record<string, unknown>
}

const getField = (source: any, keys: string[]) => {
    for (const key of keys) {
        if (source?.[key] !== undefined && source?.[key] !== null) return source[key]
    }

    return undefined
}

const toNumberOrNull = (value: unknown) => {
    const number = Number(value)

    return Number.isFinite(number) ? number : null
}

const getNonEmptyField = (source: any, keys: string[]) => {
    const value = getField(source, keys)

    return value === '' ? undefined : value
}

const toTextLines = (value: unknown): string[] => {
    const values = Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : [value]

    return values
        .map((item: any) => String(item?.info ?? item?.message ?? item?.description ?? item ?? '').trim())
        .filter(Boolean)
}

const toCellText = (value: unknown) => toTextLines(value).join(', ')

const mapValidationRow = (row: any, index: number): StaffImportValidationRow => {
    const data = row?.data && typeof row.data === 'object' ? row.data : {}
    const value = (keys: string[]) => getNonEmptyField(row, keys) ?? getNonEmptyField(data, keys)
    const last_name = String(value(['last_name', 'lastName']) ?? '')
    const middle_name = String(value(['middle_name', 'middleName']) ?? '')
    const first_name = String(value(['first_name', 'firstName']) ?? '')
    const full_name = String(getNonEmptyField(row, ['full_name', 'fullName']) ?? [last_name, middle_name, first_name].filter(Boolean).join(' '))
    const match = getField(row, ['user_found', 'userFound', 'user_exists', 'userExists', 'found'])
    const action = String(getField(row, ['action']) ?? '')
    const user_match = match === true || match === 1 || String(match).toUpperCase() === 'TRUE' || action.toUpperCase() === 'UPDATE'
        ? 'FOUND'
        : match === false || match === 0 || String(match).toUpperCase() === 'FALSE' || action.toUpperCase() === 'CREATE'
            ? 'NOT_FOUND'
            : ''

    return {
        row_number: String(getField(row, ['row_number', 'rowNumber', 'row', 'line']) ?? index + 1),
        action,
        status: String(getField(row, ['status']) ?? ''),
        user_name: String(value(['user_name', 'userName']) ?? ''),
        last_name,
        middle_name,
        first_name,
        full_name,
        phone: String(value(['phone']) ?? ''),
        email: String(value(['email']) ?? ''),
        identity_number: String(value(['identity_number', 'identityNumber']) ?? ''),
        role_codes: toCellText(getNonEmptyField(data, ['role_codes', 'roleCodes'])),
        project_codes: toCellText(value(['project_codes', 'projectCodes'])),
        errors: toTextLines(row?.errors),
        warnings: toTextLines(row?.warnings),
        user_match,
        changes: toTextLines(getNonEmptyField(row, ['changes', 'change_summary', 'changeSummary', 'changed_fields', 'changedFields']) ?? getNonEmptyField(data, ['changes', 'change_summary', 'changeSummary', 'changed_fields', 'changedFields'])),
        data
    }
}

/** Builds import users exclusively from CTH validation rows, never from a reparsed Excel file or UI fields. */
export const getValidatedStaffImportUsers = (validationResult: StaffImportValidationResult) => (
    validationResult.users.length > 0
        ? validationResult.users
        : validationResult.rows.filter(row => row.status.toUpperCase() === 'VALID').map(row => row.data)
)

const mapValidationResult = (payload: any, file: File): StaffImportValidationResult => {
    const data = payload?.dataresponse?.data ?? payload?.data ?? payload
    // CTH's validation response is authoritative at data.rows. `items` stays only as a
    // backward-compatible fallback for older response envelopes.
    const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.items) ? data.items : []

    const mapped_rows: StaffImportValidationRow[] = rows.map(mapValidationRow)

    return {
        file_name: String(getField(data, ['file_name', 'fileName']) ?? file.name),
        total_rows: toNumberOrNull(getField(data, ['total_rows', 'totalRows', 'total_count', 'totalCount'])) ?? mapped_rows.length,
        valid_rows: toNumberOrNull(getField(data, ['valid_rows', 'validRows', 'success_rows', 'successRows'])) ?? mapped_rows.filter(row => row.status.toUpperCase() === 'VALID').length,
        error_rows: toNumberOrNull(getField(data, ['error_rows', 'errorRows', 'invalid_rows', 'invalidRows'])) ?? mapped_rows.filter(row => row.status.toUpperCase() === 'INVALID').length,
        create_count: toNumberOrNull(getField(data, ['create_count', 'createCount'])) ?? mapped_rows.filter(row => row.status.toUpperCase() === 'VALID' && row.action.toUpperCase() === 'CREATE').length,
        update_count: toNumberOrNull(getField(data, ['update_count', 'updateCount'])) ?? mapped_rows.filter(row => row.status.toUpperCase() === 'VALID' && row.action.toUpperCase() === 'UPDATE').length,
        rows: mapped_rows,
        users: Array.isArray(data?.users)
            ? data.users.filter((user: unknown): user is Record<string, unknown> => Boolean(user) && typeof user === 'object')
            : mapped_rows.filter(row => row.status.toUpperCase() === 'VALID').map(row => row.data)
    }
}

/** Browser-facing service. The real CTH call and uid resolution stay inside the Next.js proxy. */
export async function downloadStaffImportTemplate(): Promise<StaffImportTemplateResponse> {
    const response = await fetch(STAFF_IMPORT_TEMPLATE_PATH, { method: 'POST' })

    if (!response.ok) throw new Error(await getErrorMessage(response))

    return {
        blob: await response.blob(),
        filename: parseContentDispositionFilename(response.headers.get('content-disposition')) || 'user_import_template.xlsx'
    }
}

/** Sends the original browser-selected Excel file to the internal BFF as multipart/form-data. */
export async function validateStaffImportFile(file: File): Promise<StaffImportValidationResult> {
    const formData = new FormData()

    formData.append('File', file)

    const response = await fetch(STAFF_IMPORT_VALIDATE_PATH, {
        method: 'POST',
        body: formData
    })

    if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể kiểm tra file import nhân viên.'))

    const payload = await response.json().catch(() => {
        throw new Error('Không thể đọc kết quả kiểm tra file import nhân viên.')
    })

    return mapValidationResult(payload, file)
}

export class StaffImportSubmitError extends Error {
    execution_id: string | null

    constructor(message: string, execution_id: string | null = null) {
        super(message)
        this.name = 'StaffImportSubmitError'
        this.execution_id = execution_id
    }
}

const extractErrorMessage = (payload: any, fallback: string) => String(
    payload?.error_message ?? payload?.errorMessage ?? payload?.message ?? payload?.error
    ?? payload?.data?.message ?? payload?.errors?.[0]?.info ?? payload?.errors?.[0]?.message ?? fallback
)

const extractExecutionId = (payload: any) => {
    const value = payload?.execution_id ?? payload?.executionId ?? payload?.data?.execution_id ?? payload?.data?.executionId

    return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Commits exactly the normalized users returned by validation; never reparses the Excel file.
 *  Unlike /import-validate, the backend import endpoint (/cth/api/users/import) takes plain JSON. */
export async function submitStaffImport(payload: { duplicate_policy: 'Create' | 'Update'; users: Record<string, unknown>[] }): Promise<{ execution_id: string | null }> {
    const response = await fetch(STAFF_IMPORT_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
    })
    const responsePayload = await response.json().catch(() => null)

    if (!response.ok || responsePayload?.success === false || String(responsePayload?.status ?? '').toUpperCase() === 'ERROR') {
        throw new StaffImportSubmitError(extractErrorMessage(responsePayload, 'Không thể import nhân viên.'), extractExecutionId(responsePayload))
    }

    return { execution_id: extractExecutionId(responsePayload) }
}
