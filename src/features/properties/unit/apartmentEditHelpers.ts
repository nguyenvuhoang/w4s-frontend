import {
  APARTMENT_RECORD_STATUS_OPTIONS,
  resolveApartmentFloorNo,
  toApartmentContractFields,
  validateApartmentCreate
} from './apartmentCreateHelpers'
import type { ApartmentCreateErrorKey } from './apartmentCreateHelpers'
import type {
  ApartmentBuildingOption,
  ApartmentDetailApartment,
  ApartmentEditFormValues,
  ApartmentFloorOption,
  ApartmentUpdateRequest
} from './types'

/** Record statuses selectable on the edit page (WF_BO_UPDATE_APARTMENT `status`). */
export const APARTMENT_EDIT_STATUS_OPTIONS = APARTMENT_RECORD_STATUS_OPTIONS

/** Backend handover date ("2026-06-15T00:00:00Z") -> date input value ("2026-06-15"); "" when not set/unknown. */
export const toHandoverDateInput = (value: string | null | undefined) => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value?.trim() ?? '')

  return match ? match[1] : ''
}

/** Edit form pre-filled from WF_BO_GET_APARTMENT_DETAIL (no defaults invented for missing values). */
export const buildApartmentEditValues = (apartment: ApartmentDetailApartment): ApartmentEditFormValues => ({
  building_id: apartment.building_id || null,
  floor_id: apartment.floor_id || null,
  unit_number: apartment.unit_number,
  apartment_type: apartment.apartment_type,
  area: apartment.area === null || apartment.area === undefined ? '' : String(apartment.area),
  room_count: apartment.room_count === null || apartment.room_count === undefined ? '' : String(apartment.room_count),
  handover_date: toHandoverDateInput(apartment.handover_date),
  water_meter_code: apartment.water_meter_code,
  electricity_meter_code: apartment.electricity_meter_code,
  description: apartment.description,
  status: apartment.status,
  // Raw stored value (a legacy value outside the CodeList is kept, never reset).
  apartment_status: apartment.apartment_status ?? ''
})

/**
 * Edit `floor`: while the apartment stays on its current floor, keep the stored apartment.floor (e.g. "01" —
 * never the floor record's default floor_no 0). A newly selected floor uses the shared rule (valid floor_no,
 * else derived from floor_code).
 */
export const resolveApartmentEditFloorNo = (
  apartment: Pick<ApartmentDetailApartment, 'floor_id' | 'floor'>,
  floorId: number | null,
  selectedFloor: Pick<ApartmentFloorOption, 'floor_no' | 'floor_code'> | null | undefined
) => (
  floorId === apartment.floor_id && apartment.floor.trim() ? apartment.floor.trim() : resolveApartmentFloorNo(selectedFloor)
)

/** Edit tower code: the selected tower option's code; the stored one while the tower is unchanged and its option is not loaded. */
export const resolveApartmentEditBuildingCode = (
  apartment: Pick<ApartmentDetailApartment, 'building_id' | 'building_code'>,
  buildingId: number | null,
  selectedBuilding: Pick<ApartmentBuildingOption, 'building_code'> | null | undefined
) => (
  selectedBuilding?.building_code?.trim() || (buildingId === apartment.building_id ? apartment.building_code.trim() : '')
)

export type ApartmentEditErrorKey = ApartmentCreateErrorKey

/** Same rules as create (incl. the required status) on the resolved code parts (project is the apartment's own project). */
export const validateApartmentEdit = (
  projectId: number | null | undefined,
  values: ApartmentEditFormValues,
  codeParts: { buildingCode: string; floorNo: string | null }
): ApartmentEditErrorKey[] => {
  return validateApartmentCreate(
    projectId,
    values,
    { building_code: codeParts.buildingCode },
    { floor_no: codeParts.floorNo ?? '', floor_code: '' }
  )
}

/**
 * WF_BO_UPDATE_APARTMENT request with all 17 contract fields (no project_id). Inputs map like create;
 * water_meter_code2 / electric_meter_code have no input and keep the values loaded from the detail.
 */
export const buildApartmentUpdateRequest = (
  id: number,
  values: ApartmentEditFormValues,
  codeParts: { buildingCode: string; floorNo: string; apartmentCode?: string },
  preserved: Pick<ApartmentDetailApartment, 'water_meter_code2' | 'electric_meter_code'>
): ApartmentUpdateRequest => {
  const fields = toApartmentContractFields(values, codeParts)

  return {
    id,
    building_id: fields.building_id,
    floor_id: fields.floor_id,
    apartment_code: fields.apartment_code,
    unit_number: fields.unit_number,
    floor: fields.floor,
    water_meter_code: fields.water_meter_code,
    water_meter_code2: preserved.water_meter_code2,
    electric_meter_code: preserved.electric_meter_code,
    electricity_meter_code: fields.electricity_meter_code,
    apartment_type: fields.apartment_type,
    // Code value from the CodeList select, or the stored (legacy) value when unchanged — never a caption.
    apartment_status: values.apartment_status,
    area: fields.area,
    room_count: fields.room_count,
    handover_date: fields.handover_date,
    description: fields.description,
    status: values.status
  }
}
