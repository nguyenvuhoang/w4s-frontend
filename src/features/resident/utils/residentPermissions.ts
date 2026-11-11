export const RESIDENT_APARTMENT_PERMISSION_KEYS = {
    addOwnerApartment: 'resident:apartment:add-owner',
    addResidentApartment: 'resident:apartment:add-resident'
} as const

export type ResidentApartmentPermissionKey =
    typeof RESIDENT_APARTMENT_PERMISSION_KEYS[keyof typeof RESIDENT_APARTMENT_PERMISSION_KEYS]

// TODO: Route through the project's real per-action permission system once it exposes granular
// checks for resident apartment relations. Both keys currently resolve to the same allowed state,
// gated only by the existing route-level AuthorizedLayout guard on /resident/list.
export const canUseResidentApartmentAction = (_key: ResidentApartmentPermissionKey): boolean => true
