import type { Locale } from '@/configs/i18n'
import type { Session } from 'next-auth'

import type { ApartmentDictionary } from '../types'

export type UnitImportPageProps = {
  dictionary: ApartmentDictionary
  session: Session | null
  locale: Locale
}

// Confirmed response shape of POST /api/apartment/import-validate (-> ips/api/apartmentimport/validate),
// data.apartments[] — normalized apartment data, present for rows the backend could build a full
// apartment record for.
export type ApartmentValidatedItem = {
  building_code: string
  floor_code: string
  unit_number: string
  apartment_code: string
  apartment_type: string
  /** Apartment record status (e.g. "Occupied") — NOT the row's validation result, see ApartmentValidationRow.status. */
  status: string
  electric_meter_code: string
  water_meter_code: string
  water_meter_code_2: string
  area: number
  room_count: number
  description: string | null
}

// data.rows[] — one entry per Excel row's validation result. May exist without a matching
// apartments[] entry (typically INVALID rows the backend could not normalize into an apartment).
export type ApartmentValidationRow = {
  row_number: number
  /** Validation result (e.g. "VALID"/"INVALID") — NOT the apartment's own status field. */
  status: string
  building_code: string
  floor_code: string
  unit_number: string
  apartment_code: string
  apartment_type: string
  apartment_id: number | null
  errors: string[]
}

/**
 * Table display model merging ApartmentValidatedItem + ApartmentValidationRow (see
 * unitImportBackendMapper.ts). Field names are deliberately distinct from the raw API fields
 * (apartmentStatus vs validationStatus in particular) so the two same-named-but-different
 * `status` fields from the API can never be bound to the wrong UI element by accident.
 */
export type ApartmentImportDisplayRow = {
  rowNumber: number
  buildingCode: string | null
  floorCode: string | null
  unitNumber: string | null
  apartmentCode: string | null
  apartmentType: string | null
  apartmentStatus: string | null
  electricMeterCode: string | null
  waterMeterCode: string | null
  waterMeterCode2: string | null
  area: number | null
  roomCount: number | null
  description: string | null
  validationStatus: string
  errors: string[]
  apartmentId: number | null
}

export type UnitImportValidationSummary = {
  file_name: string
  total_rows: number
  valid_rows: number
  error_rows: number
  /** Merged/display model for the preview table (see unitImportBackendMapper.ts). */
  rows: ApartmentImportDisplayRow[]
  /**
   * The raw `data.apartments[]` array exactly as returned by the validate API, kept alongside
   * `rows` so the Import submit step can send it verbatim as WF_BO_IMPORT_APARTMENTS's `items` —
   * per the confirmed contract, the backend's own already-validated/normalized apartment objects
   * are the source of truth for import, not a re-derivation from the (pagination-sliced) table.
   */
  apartments: ApartmentValidatedItem[]
}

/**
 * Single source of truth for the duplicate-handling policy sent to WF_BO_IMPORT_APARTMENTS —
 * apartments that already exist get updated with the imported file's data, never skipped.
 * Referenced everywhere the value is needed instead of repeating the 'UPDATE' literal.
 */
export const UNIT_IMPORT_DUPLICATE_POLICY = 'UPDATE' as const
export type UnitImportDuplicatePolicy = typeof UNIT_IMPORT_DUPLICATE_POLICY

export type UnitImportSubmitPayload = {
  project_id: number
  duplicate_policy: UnitImportDuplicatePolicy
  items: ApartmentValidatedItem[]
}

/**
 * All counts are optional: WF_BO_IMPORT_APARTMENTS's actual response fields aren't confirmed yet,
 * so the UI must only display whichever of these the backend actually returns (see
 * unitImportService.ts) rather than inventing zeros for fields that never came back.
 */
export type UnitImportSubmitResult = {
  total_count: number | null
  created_count: number | null
  updated_count: number | null
  skipped_count: number | null
  error_count: number | null
  execution_id: string | null
}
