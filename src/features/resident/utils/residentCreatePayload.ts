import type { CreateResidentProfileRequest, ResidentApartmentFormValue, ResidentProfileFormValues } from '../types'

const normalizeText = (value: string) => value?.trim() || ''

type ResidentCreatePayloadFields = Pick<ResidentProfileFormValues,
    'fullName' | 'phoneNumber' | 'email' | 'gender' | 'dateOfBirth' | 'identityNo' | 'nationality' | 'description' | 'username' | 'password'
>

export const buildCreateResidentProfilePayload = (
    data: ResidentCreatePayloadFields,
    apartments: ResidentApartmentFormValue[]
): CreateResidentProfileRequest => {
    const nationality = normalizeText(data.nationality)
    const description = normalizeText(data.description)

    return {
        owner: {
            full_name: data.fullName.trim(),
            phone_number: normalizeText(data.phoneNumber),
            email: normalizeText(data.email),
            nationality,
            description,
            gender: data.gender,
            date_of_birth: normalizeText(data.dateOfBirth),
            identity_no: normalizeText(data.identityNo)
        },
        apartments: apartments.map(apartment => ({
            project_code: apartment.projectCode,
            apartment_code: apartment.apartmentCode,
            apartment_type: apartment.apartmentType,
            electric_meter_code: apartment.electricMeterCode,
            water_meter_code: apartment.waterMeterCode,
            resident_role: apartment.residentRole,
            apartment_relationship: apartment.apartmentRelationship,
            move_in_date: normalizeText(apartment.moveInDate)
        })),
        app_account: {
            username: data.username.trim(),
            password: data.password
        },
        policy_id: 1,
        nationality,
        description
    }
}
