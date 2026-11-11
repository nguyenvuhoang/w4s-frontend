import { describe, expect, it } from 'vitest'

import { buildCreateResidentProfilePayload } from './residentCreatePayload'

describe('buildCreateResidentProfilePayload', () => {
    it('sends the same localized nationality and description in owner and root fields', () => {
        const payload = buildCreateResidentProfilePayload({
            fullName: 'Nguyễn Văn A',
            phoneNumber: '0900000000',
            email: 'a@example.com',
            gender: 'M',
            dateOfBirth: '1990-01-01',
            identityNo: '0123456789',
            nationality: 'Việt Nam',
            description: 'Hồ sơ cư dân tạo mới',
            username: 'nguyenvana',
            password: 'Password@123'
        }, [])

        expect(payload.owner.nationality).toBe('Việt Nam')
        expect(payload.owner.description).toBe('Hồ sơ cư dân tạo mới')
        expect(payload.nationality).toBe(payload.owner.nationality)
        expect(payload.description).toBe(payload.owner.description)
    })

    it('trims contact details and preserves the resident role selected for an apartment', () => {
        const payload = buildCreateResidentProfilePayload({
            fullName: 'Nguyễn Văn A',
            phoneNumber: ' 0900000000 ',
            email: ' a@example.com ',
            gender: 'M',
            dateOfBirth: '',
            identityNo: '',
            nationality: '',
            description: '',
            username: 'nguyenvana',
            password: 'Password@123'
        }, [{
            id: 'apartment-1',
            projectCode: 'PROJECT-1',
            apartmentCode: 'A-01',
            apartmentType: '',
            apartmentTypeLabel: '',
            electricMeterCode: '',
            waterMeterCode: '',
            hasOwner: false,
            residentRole: 'TENANT',
            apartmentRelationship: 'OTHER',
            moveInDate: '',
            selectedApartment: null
        }])

        expect(payload.owner.phone_number).toBe('0900000000')
        expect(payload.owner.email).toBe('a@example.com')
        expect(payload.apartments[0]?.resident_role).toBe('TENANT')
        expect(payload.apartments[0]?.apartment_relationship).toBe('OTHER')
    })
})
