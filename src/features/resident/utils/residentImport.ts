import type {
    ResidentImportRequestItem,
    ResidentImportValidationRow,
    ResidentImportValidationSummary
} from '../types'

export type ResidentImportClipboardMessages = {
    clipboardSourceName: string
    clipboardEmpty: string
    clipboardMissingHeaders: string
    clipboardNoRows: string
    clipboardTooManyColumns: string
    clipboardInvalidIsOwner: string
    validationRequired: string
    validationEmail: string
    validationInvalidDate: string
    validationInvalidGender: string
    validationInvalidRelationship: string
}

export const SUPPORTED_HEADERS = [
    'FullName',
    'PhoneNumber',
    'Email',
    'IdentityNo',
    'DateOfBirth',
    'Gender',
    'ApartmentCode',
    'RelationshipType',
    'IsOwner',
    'MoveInDate',
    'Note'
] as const

const REQUIRED_HEADERS = [
    'FullName',
    'IdentityNo',
    'DateOfBirth',
    'Gender',
    'ApartmentCode',
    'RelationshipType',
    'IsOwner',
    'MoveInDate'
] as const

export type SupportedHeader = typeof SUPPORTED_HEADERS[number]
export type ResidentImportRowField = keyof Omit<ResidentImportValidationRow, 'row_number' | 'status' | 'errors'>

export const HEADER_TO_FIELD: Record<SupportedHeader, ResidentImportRowField> = {
    FullName: 'full_name',
    PhoneNumber: 'phone_number',
    Email: 'email',
    IdentityNo: 'identity_no',
    DateOfBirth: 'date_of_birth',
    Gender: 'gender',
    ApartmentCode: 'apartment_code',
    RelationshipType: 'relationship_type',
    IsOwner: 'is_owner',
    MoveInDate: 'move_in_date',
    Note: 'note'
}

const SUPPORTED_HEADER_LOOKUP = SUPPORTED_HEADERS.reduce<Record<string, SupportedHeader>>((acc, header) => {
    acc[normalizeHeader(header)] = header

    return acc
}, {})

export const VALID_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER', 'M', 'F', 'O'])
export const VALID_RELATIONSHIP_TYPES = new Set([
    'OWNER',
    'TENANT',
    'FAMILY_MEMBER',
    'MEMBER',
    'FAMILY',
    'REPRESENTATIVE',
    'AUTHORIZED_REPRESENTATIVE',
    'SPOUSE',
    'CHILD',
    'PARENT',
    'SIBLING',
    'RELATIVE',
    'OCCUPANT',
    'OTHER'
])

const TRUE_VALUES = new Set(['Y', 'YES', 'TRUE', '1'])
const FALSE_VALUES = new Set(['N', 'NO', 'FALSE', '0', ''])

export function normalizeHeader(value: string) {
    return value.trim().toLowerCase().replace(/[_\-\s]/g, '')
}

function formatMessage(template: string, replacements: Record<string, string>) {
    return Object.entries(replacements).reduce(
        (message, [key, value]) => message.replaceAll(`{${key}}`, value),
        template
    )
}

function requiredMessage(messages: ResidentImportClipboardMessages, field: string) {
    return formatMessage(messages.validationRequired, { field })
}

function normalizeOptionalCell(value: string) {
    const trimmed = value.trim()

    return trimmed ? trimmed : null
}

function normalizeUpperCell(value: string) {
    const trimmed = value.trim()

    return trimmed ? trimmed.toUpperCase() : null
}

function parseOwnerFlag(value: string) {
    const normalized = value.trim().toUpperCase()

    if (TRUE_VALUES.has(normalized)) return { value: 'Y', isValid: true }
    if (FALSE_VALUES.has(normalized)) return { value: 'N', isValid: true }

    return { value: normalized || null, isValid: false }
}

function isValidDate(value: string | null) {
    if (!value) return false
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

    const date = new Date(`${value}T00:00:00Z`)

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isValidEmail(value: string | null) {
    if (!value) return true

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function buildResidentImportPayloadRow(
    row: ResidentImportValidationRow
): ResidentImportRequestItem {
    const isOwnerRow = row.is_owner === 'Y' || row.relationship_type === 'OWNER'
    const gender = row.gender === 'MALE'
        ? 'M'
        : row.gender === 'FEMALE'
            ? 'F'
            : row.gender === 'OTHER'
                ? 'O'
                : row.gender || null

    return {
        full_name: row.full_name?.trim(),
        gender,
        date_of_birth: row.date_of_birth || null,
        phone: row.phone_number?.trim() || null,
        email: row.email?.trim() || null,
        identity_number: row.identity_no?.trim() || null,
        apartment_code: row.apartment_code?.trim().toUpperCase() ?? '',
        role: isOwnerRow ? 'OWNER' : 'RESIDENT',
        relationship_with_owner: isOwnerRow ? null : row.relationship_type || null,
        is_location: true,
        is_representative: isOwnerRow || row.relationship_type === 'REPRESENTATIVE',
        effective_from: row.move_in_date || null,
        effective_to: null
    }
}

export function validateRow(row: ResidentImportValidationRow, messages: ResidentImportClipboardMessages) {
    const errors: string[] = []

    if (!row.full_name) errors.push(requiredMessage(messages, 'FullName'))
    if (!row.identity_no) errors.push(requiredMessage(messages, 'IdentityNo'))
    if (!row.date_of_birth) errors.push(requiredMessage(messages, 'DateOfBirth'))
    if (row.date_of_birth && !isValidDate(row.date_of_birth)) errors.push(messages.validationInvalidDate)
    if (!row.gender) errors.push(requiredMessage(messages, 'Gender'))
    if (row.gender && !VALID_GENDERS.has(row.gender)) errors.push(messages.validationInvalidGender)
    if (!row.apartment_code) errors.push(requiredMessage(messages, 'ApartmentCode'))
    if (!row.relationship_type) errors.push(requiredMessage(messages, 'RelationshipType'))
    if (row.relationship_type && !VALID_RELATIONSHIP_TYPES.has(row.relationship_type)) {
        errors.push(messages.validationInvalidRelationship)
    }
    if (!row.move_in_date) errors.push(requiredMessage(messages, 'MoveInDate'))
    if (row.move_in_date && !isValidDate(row.move_in_date)) errors.push(messages.validationInvalidDate)
    if (!isValidEmail(row.email)) errors.push(messages.validationEmail)

    return errors
}

export function parseResidentImportClipboardText(
    clipboardText: string,
    messages: ResidentImportClipboardMessages
): ResidentImportValidationSummary {
    const sourceText = clipboardText.replace(/^\uFEFF/, '')

    if (!sourceText.replace(/[\t\r\n ]/g, '')) {
        throw new Error(messages.clipboardEmpty)
    }

    const lines = sourceText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    const headerLine = lines[0] ?? ''
    const headerCells = headerLine.split('\t').map(cell => cell.trim())
    const mappedHeaders = headerCells.map(header => SUPPORTED_HEADER_LOOKUP[normalizeHeader(header)] ?? null)
    const missingHeaders = REQUIRED_HEADERS.filter(header => !mappedHeaders.includes(header))

    if (missingHeaders.length > 0) {
        throw new Error(formatMessage(messages.clipboardMissingHeaders, { columns: missingHeaders.join(', ') }))
    }

    const rows: ResidentImportValidationRow[] = []

    lines.slice(1).forEach((line, index) => {
        const rowNumber = index + 2
        const rawCells = line.split('\t')

        if (rawCells.every(cell => cell.trim() === '')) return

        const cells = rawCells.length < headerCells.length
            ? [...rawCells, ...Array.from({ length: headerCells.length - rawCells.length }, () => '')]
            : rawCells
        const row: ResidentImportValidationRow = {
            row_number: rowNumber,
            status: 'VALID',
            full_name: null,
            phone_number: null,
            email: null,
            identity_no: null,
            date_of_birth: null,
            gender: null,
            apartment_code: null,
            relationship_type: null,
            is_owner: null,
            move_in_date: null,
            note: null,
            errors: []
        }

        mappedHeaders.forEach((header, cellIndex) => {
            if (!header) return

            const field = HEADER_TO_FIELD[header]
            const cell = cells[cellIndex] ?? ''

            if (header === 'Gender' || header === 'RelationshipType') {
                row[field] = normalizeUpperCell(cell)
            } else if (header === 'IsOwner') {
                const parsed = parseOwnerFlag(cell)

                row.is_owner = parsed.value

                if (!parsed.isValid) row.errors.push(messages.clipboardInvalidIsOwner)
            } else {
                row[field] = normalizeOptionalCell(cell)
            }
        })

        if (rawCells.length > headerCells.length) {
            row.errors.push(formatMessage(messages.clipboardTooManyColumns, { row: String(rowNumber) }))
        }

        row.errors = [...row.errors, ...validateRow(row, messages)]
        row.status = row.errors.length > 0 ? 'INVALID' : 'VALID'
        rows.push(row)
    })

    if (rows.length === 0) {
        throw new Error(messages.clipboardNoRows)
    }

    return {
        batch_id: 0,
        file_name: messages.clipboardSourceName,
        total_rows: rows.length,
        valid_rows: rows.filter(row => row.status === 'VALID').length,
        error_rows: rows.filter(row => row.status !== 'VALID').length,
        rows
    }
}
