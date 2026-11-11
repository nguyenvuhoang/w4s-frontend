import { deriveFloorContractFields } from '@/features/properties/floor/floorHelpers'

import { isValidAreaInput } from './apartmentHelpers'
import type { ApartmentBuildingOption, ApartmentCreateFormValues, ApartmentCreateRequest, ApartmentFloorOption } from './types'

export const emptyApartmentCreateValues: ApartmentCreateFormValues = {
  building_id: null,
  floor_id: null,
  unit_number: '',
  apartment_type: '',
  area: '',
  room_count: '',
  handover_date: '',
  water_meter_code: '',
  electricity_meter_code: '',
  description: '',
  status: 'A',
  apartment_status: ''
}

/** Record statuses selectable on the create and edit pages (`status`). */
export const APARTMENT_RECORD_STATUS_OPTIONS = ['A', 'I']

/**
 * `floor` of WF_BO_CREATE_APARTMENT (confirmed): the selected floor's floor_no, falling back to the floor
 * number derived from its floor code (Floor module rule: trailing digits). null when neither is known.
 * Never derived from the floor name.
 */
export const resolveApartmentFloorNo = (floor: Pick<ApartmentFloorOption, 'floor_no' | 'floor_code'> | null | undefined) => {
  if (!floor) return null

  const floorNo = floor.floor_no?.trim() ?? ''
  const derived = deriveFloorContractFields(floor.floor_code ?? '')?.floor_no ?? null
  const isZero = (value: string) => /^0+$/.test(value)

  // A zero floor_no contradicting the floor code (code "01", floor_no 0) is a Backend default, not the floor number.
  if (floorNo && !(isZero(floorNo) && derived && !isZero(derived))) return floorNo

  return derived
}

/**
 * Full apartment code = Tower – Floor – Unit, e.g. ("A1", "01", "01") -> "A1-01-01".
 * Segments are trimmed text (leading zeros kept, no number parsing); "" when any segment is missing,
 * so no partial code like "A1--01" is ever produced.
 */
export const buildApartmentCode = ({
  buildingCode,
  floorNo,
  unitNumber
}: {
  buildingCode: string | null | undefined
  floorNo: string | null | undefined
  unitNumber: string | null | undefined
}) => {
  const segments = [buildingCode, floorNo, unitNumber].map(segment => segment?.trim() ?? '')

  return segments.every(Boolean) ? segments.join('-') : ''
}

/** Generated full code for the current selection (tower code, floor number, typed unit number). */
export const getGeneratedApartmentCode = (
  building: Pick<ApartmentBuildingOption, 'building_code'> | null | undefined,
  floor: Pick<ApartmentFloorOption, 'floor_no' | 'floor_code'> | null | undefined,
  unitNumber: string
) => buildApartmentCode({ buildingCode: building?.building_code, floorNo: resolveApartmentFloorNo(floor), unitNumber })

/**
 * Full code shown in the form: the user's custom code (custom mode, kept as typed) or, in auto mode (null),
 * the generated code. Trimmed on submit.
 */
export const resolveApartmentCodeInput = (customCode: string | null, generatedCode: string) => customCode ?? generatedCode

/** Custom mode with an empty (blank) code: the full code is required. */
export const isCustomApartmentCodeMissing = (customCode: string | null) => customCode !== null && !customCode.trim()

/**
 * Edit init: a stored apartment_code that differs from the formula on the stored parts is a custom code
 * (shown unchanged, never regenerated); the same code — or none stored — keeps the auto mode (null).
 */
export const getInitialCustomApartmentCode = (
  apartment: { apartment_code: string | null | undefined; building_code: string | null | undefined; floor: string | null | undefined; unit_number: string | null | undefined }
) => {
  const storedCode = apartment.apartment_code?.trim() ?? ''
  const generatedCode = buildApartmentCode({ buildingCode: apartment.building_code, floorNo: apartment.floor, unitNumber: apartment.unit_number })

  return storedCode && storedCode !== generatedCode ? storedCode : null
}

/** Date input (YYYY-MM-DD) -> "YYYY-MM-DDT00:00:00Z" as in the Backend sample; "" when not set (confirmed). */
export const toApartmentHandoverDate = (value: string) => (
  /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? `${value.trim()}T00:00:00Z` : ''
)

export { isValidAreaInput }

export const isValidRoomCountInput = (value: string) => value.trim() === '' || /^\d+$/.test(value.trim())

export type ApartmentCreateErrorKey =
  | 'project'
  | 'building_id'
  | 'building_code'
  | 'floor_id'
  | 'floor_no'
  | 'unit_number'
  | 'area'
  | 'room_count'
  | 'status'
  | 'apartment_code'

/** Returns the invalid fields; empty when the form can be submitted (all three code segments are known, status set). */
export const validateApartmentCreate = (
  projectId: number | null | undefined,
  values: ApartmentCreateFormValues,
  selectedBuilding: Pick<ApartmentBuildingOption, 'building_code'> | null | undefined,
  selectedFloor: Pick<ApartmentFloorOption, 'floor_no' | 'floor_code'> | null | undefined
): ApartmentCreateErrorKey[] => {
  const errors: ApartmentCreateErrorKey[] = []

  if (!projectId) errors.push('project')
  if (!values.building_id) errors.push('building_id')
  else if (!selectedBuilding?.building_code?.trim()) errors.push('building_code')
  if (!values.floor_id) errors.push('floor_id')
  else if (!resolveApartmentFloorNo(selectedFloor)) errors.push('floor_no')
  if (!values.unit_number.trim()) errors.push('unit_number')
  if (!isValidAreaInput(values.area)) errors.push('area')
  if (!isValidRoomCountInput(values.room_count)) errors.push('room_count')
  if (!values.status.trim()) errors.push('status')

  return errors
}

/**
 * Contract values of the form inputs shared by create and update: apartment_code (the form's full code —
 * custom or auto — trimmed, else generated), trimmed texts, floor number, area as a string, room_count as a
 * number (empty input -> 0, int default — pending Backend confirmation) and the ISO handover date ("" when not set).
 */
export const toApartmentContractFields = (
  values: ApartmentCreateFormValues,
  codeParts: { buildingCode: string; floorNo: string; apartmentCode?: string }
) => {
  const unitNumber = values.unit_number.trim()

  return {
    building_id: values.building_id ?? 0,
    floor_id: values.floor_id ?? 0,
    apartment_code: codeParts.apartmentCode?.trim()
      || buildApartmentCode({ buildingCode: codeParts.buildingCode, floorNo: codeParts.floorNo, unitNumber }),
    unit_number: unitNumber,
    floor: codeParts.floorNo,
    water_meter_code: values.water_meter_code.trim(),
    electricity_meter_code: values.electricity_meter_code.trim(),
    apartment_type: values.apartment_type,
    area: values.area.trim(),
    room_count: values.room_count.trim() === '' ? 0 : Number.parseInt(values.room_count.trim(), 10),
    handover_date: toApartmentHandoverDate(values.handover_date),
    description: values.description.trim()
  }
}

/**
 * WF_BO_CREATE_APARTMENT request with all 17 contract fields. apartment_code is the form's full code (auto:
 * generated, custom: as typed, trimmed); unit_number keeps its own trimmed value; floor is the floor number;
 * apartment_status is the CodeList code value ("" when not chosen), status the record status. Hidden
 * contract fields without an input yet (water_meter_code2, electric_meter_code) are sent as "".
 */
export const buildApartmentCreateRequest = (
  projectId: number,
  values: ApartmentCreateFormValues,
  codeParts: { buildingCode: string; floorNo: string; apartmentCode?: string }
): ApartmentCreateRequest => {
  const fields = toApartmentContractFields(values, codeParts)

  return {
    project_id: projectId,
    building_id: fields.building_id,
    floor_id: fields.floor_id,
    apartment_code: fields.apartment_code,
    unit_number: fields.unit_number,
    floor: fields.floor,
    water_meter_code: fields.water_meter_code,
    water_meter_code2: '',
    electric_meter_code: '',
    electricity_meter_code: fields.electricity_meter_code,
    apartment_type: fields.apartment_type,
    apartment_status: values.apartment_status,
    area: fields.area,
    room_count: fields.room_count,
    handover_date: fields.handover_date,
    description: fields.description,
    status: values.status
  }
}
