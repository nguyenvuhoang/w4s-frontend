'use client'

import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'
import Swal from 'sweetalert2'

import SwalAlert from '@/shared/utils/SwalAlert'

import { commonText, vendorsText } from '../components/vendorHelpers'
import { vendorService } from '../services/vendorService'
import type { VendorItem, VendorsDictionary } from '../vendorTypes'

type Params = {
    dictionary: VendorsDictionary
    locale: string
    sessiontoken?: string
    vendor: VendorItem | null
    initialError?: string | null
}

export const useVendorDetail = ({ dictionary, locale, sessiontoken, vendor, initialError = null }: Params) => {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)

    const goBack = () => {
        router.push(`/${locale}/contracts/company`)
    }

    const deleteVendor = async () => {
        if (!vendor?.id || deleting) return

        const result = await Swal.fire({
            title: vendorsText(dictionary, 'delete_vendor_title', 'Delete Vendor'),
            text: vendorsText(dictionary, 'delete_vendor_confirm', 'Are you sure you want to delete this vendor?'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: commonText(dictionary, 'delete', 'Delete'),
            cancelButtonText: commonText(dictionary, 'cancel', 'Cancel'),
            confirmButtonColor: '#d32f2f'
        })

        if (!result.isConfirmed) return

        setDeleting(true)

        try {
            await vendorService.deleteVendor({
                sessiontoken,
                language: locale as any,
                fields: {
                    id: vendor.id
                }
            })

            SwalAlert('success', vendorsText(dictionary, 'vendor_delete_success', 'Vendor deleted successfully.'), 'center')
            router.push(`/${locale}/contracts/company`)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : vendorsText(dictionary, 'vendor_delete_failed', 'Unable to delete vendor.')

            SwalAlert('error', message, 'center')
        } finally {
            setDeleting(false)
        }
    }

    return {
        vendor,
        error: initialError,
        deleting,
        goBack,
        deleteVendor
    }
}
