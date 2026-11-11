import type {
  ApartmentImportDisplayRow,
  ApartmentValidatedItem,
  ApartmentValidationRow,
  UnitImportValidationSummary
} from '../types'

/**
 * Contract for /api/apartment/import-validate (-> ips/api/apartmentimport/validate): the response
 * carries two separate collections somewhere under the JSON body —
 *  - an "apartments" collection (ApartmentValidatedItem): normalized apartment data — area,
 *    room_count, status, electric_meter_code, water_meter_code, water_meter_code_2, description.
 *    Only present for rows the backend could fully build an apartment record for.
 *  - a "rows"/validation collection (ApartmentValidationRow): one entry per Excel row —
 *    row_number, status, errors, plus the same building/floor/unit/apartment codes for matching
 *    back to the apartments collection.
 * The exact envelope (`response.data.apartments` vs `response.data.data.apartments` vs some other
 * nesting) was not something a live call could be made against while wiring this up, and guessing
 * wrong here previously left every apartments-only column blank. findArraysByShape below sidesteps
 * that entirely: it scans the whole parsed JSON tree and picks out the two arrays by the *shape* of
 * their items (which fields they carry), not by a hardcoded property path — so it keeps working
 * regardless of how many wrapper levels the backend puts around them.
 */

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key)

// Fields that only ever exist on an apartments[] item — none of these exist on a rows[] item.
const isApartmentItemShape = (value: unknown): value is ApartmentValidatedItem => (
  Boolean(value) && typeof value === 'object'
  && (
    hasOwn(value as object, 'area')
    || hasOwn(value as object, 'room_count')
    || hasOwn(value as object, 'electric_meter_code')
    || hasOwn(value as object, 'water_meter_code')
    || hasOwn(value as object, 'water_meter_code_2')
  )
)

// Fields that only ever exist on a rows[] (validation) item.
const isValidationRowShape = (value: unknown): value is ApartmentValidationRow => (
  Boolean(value) && typeof value === 'object'
  && (hasOwn(value as object, 'row_number') || hasOwn(value as object, 'errors'))
)

const findArraysByShape = (root: unknown): { apartments: ApartmentValidatedItem[]; rows: ApartmentValidationRow[] } => {
  const arrays: unknown[][] = []
  const visited = new Set<unknown>()

  const visit = (value: unknown, depth: number) => {
    if (!value || typeof value !== 'object' || depth > 6 || visited.has(value)) return

    visited.add(value)

    if (Array.isArray(value)) {
      arrays.push(value)

      return
    }

    Object.values(value).forEach(child => visit(child, depth + 1))
  }

  visit(root, 0)

  const apartmentsArray = arrays.find(arr => arr.length > 0 && isApartmentItemShape(arr[0]))
  const rowsArray = arrays.find(arr => arr.length > 0 && isValidationRowShape(arr[0]) && arr !== apartmentsArray)

  return {
    apartments: (apartmentsArray ?? []) as ApartmentValidatedItem[],
    rows: (rowsArray ?? []) as ApartmentValidationRow[]
  }
}

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  return text ? text : null
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const mapBackendErrorMessages = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .map(error => {
      if (error === null || error === undefined || error === '') return ''

      const message = (error as any)?.info ?? (error as any)?.message ?? (typeof error === 'string' ? error : '')

      return String(message ?? '').trim()
    })
    .filter(Boolean)
}

/**
 * `building_code|floor_code|unit_number|apartment_code` — the join key linking a rows[] entry back
 * to its apartments[] counterpart. Both collections carry these same 4 fields per the confirmed
 * type contract, so this works whichever side (row or apartment) it's built from.
 */
const createApartmentKey = (item: {
  building_code?: string | null
  floor_code?: string | null
  unit_number?: string | null
  apartment_code?: string | null
}): string => (
  [item.building_code ?? '', item.floor_code ?? '', item.unit_number ?? '', item.apartment_code ?? ''].join('|')
)

/** A row is valid only when the backend both marked it VALID and reported no errors on it. */
export const isApartmentImportRowValid = (row: ApartmentImportDisplayRow): boolean => (
  row.errors.length === 0 && row.validationStatus.toUpperCase() === 'VALID'
)

export function buildUnitImportSummaryTotals(rows: ApartmentImportDisplayRow[]) {
  return {
    total_rows: rows.length,
    valid_rows: rows.filter(isApartmentImportRowValid).length,
    error_rows: rows.filter(row => !isApartmentImportRowValid(row)).length
  }
}

export function mapUnitImportBackendValidationResponse(
  response: unknown,
  sourceFileName: string
): UnitImportValidationSummary {
  // Dev-only — lets whoever is wiring this up against the real backend confirm the actual
  // envelope shape and row/apartment counts straight from the browser console. Gated on
  // NODE_ENV so it never runs in a production build (same pattern as generateFeeBackendMapper.ts).
  if (process.env.NODE_ENV !== 'production') {
  }

  const { apartments, rows: validationRows } = findArraysByShape(response)

  if (process.env.NODE_ENV !== 'production') {
  }

  const apartmentMap = new Map<string, ApartmentValidatedItem>(
    apartments.map(apartment => [createApartmentKey(apartment), apartment])
  )

  // Driven by validationRows (not apartments): every Excel row has a rows[] entry (including
  // INVALID ones with no apartments[] counterpart), so mapping over it 1:1 guarantees the display
  // list always has exactly rows.length entries — no row can ever be silently dropped during merge.
  const rows: ApartmentImportDisplayRow[] = validationRows.map((validationRow, index) => {
    const apartment = apartmentMap.get(createApartmentKey(validationRow))

    return {
      rowNumber: toNumber(validationRow.row_number, index + 1),
      validationStatus: String(validationRow.status ?? '').trim(),
      errors: mapBackendErrorMessages(validationRow.errors),

      // Shared fields: prefer the apartments[] copy (normalized), fall back to the rows[] copy —
      // both collections carry these per the confirmed contract.
      buildingCode: toStringOrNull(apartment?.building_code ?? validationRow.building_code),
      floorCode: toStringOrNull(apartment?.floor_code ?? validationRow.floor_code),
      unitNumber: toStringOrNull(apartment?.unit_number ?? validationRow.unit_number),
      apartmentCode: toStringOrNull(apartment?.apartment_code ?? validationRow.apartment_code),
      apartmentType: toStringOrNull(apartment?.apartment_type ?? validationRow.apartment_type),

      // apartments[]-only fields — genuinely unavailable (null, displayed as "-") when this row
      // has no matching apartments[] entry.
      apartmentStatus: toStringOrNull(apartment?.status),
      electricMeterCode: toStringOrNull(apartment?.electric_meter_code),
      waterMeterCode: toStringOrNull(apartment?.water_meter_code),
      waterMeterCode2: toStringOrNull(apartment?.water_meter_code_2),
      area: toNullableNumber(apartment?.area),
      roomCount: toNullableNumber(apartment?.room_count),
      description: toStringOrNull(apartment?.description),

      apartmentId: toNullableNumber(validationRow.apartment_id)
    }
  })

  if (process.env.NODE_ENV !== 'production') {
  }

  return {
    file_name: sourceFileName,
    rows,
    // Kept verbatim (not re-derived from `rows`) so Import can submit it as-is — see
    // UnitImportValidationSummary.apartments in types.ts.
    apartments,
    ...buildUnitImportSummaryTotals(rows)
  }
}
