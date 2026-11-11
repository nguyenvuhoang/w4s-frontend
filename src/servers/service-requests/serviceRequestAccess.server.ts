import 'server-only'

import type { Locale } from '@/configs/i18n'
import { formService } from '@/servers/system-service'
import { hasScreenViewAccess } from '@utils/authorization'
import { isValidResponse } from '@utils/isValidResponse'

// The messages gateway still uses numeric service_request_id, while the service request detail
// workflow uses request_code. This guard verifies menu access only and must not call the detail
// workflow with an id.
const SERVICE_REQUESTS_MODULE_PATH = '/service-requests/service-requests'

export class ServiceRequestAccessError extends Error {
    status: 401 | 403 | 404 | 502
    next_action?: string

    constructor(message: string, status: 401 | 403 | 404 | 502, next_action?: string) {
        super(message)
        this.name = 'ServiceRequestAccessError'
        this.status = status
        this.next_action = next_action
    }
}

export const assertServiceRequestAccess = async ({
    uid,
    language,
    serviceRequestId
}: {
    uid: string
    language: Locale
    serviceRequestId: number
}): Promise<void> => {
    if (!serviceRequestId) throw new ServiceRequestAccessError('Service request not found.', 404)

    const menuResponse = await formService.getMenuInfo({ sessiontoken: uid, language })

    if (menuResponse.status === 401 || (menuResponse as any)?.payload?.requireLogout) {
        throw new ServiceRequestAccessError('Session expired or unauthorized. Please login again.', 401, 'logout')
    }

    if (
        !isValidResponse(menuResponse)
        || (menuResponse.payload?.dataresponse?.errors && menuResponse.payload.dataresponse.errors.length > 0)
    ) {
        throw new ServiceRequestAccessError('Unable to verify permissions.', 502)
    }

    const userCommand = (menuResponse.payload?.dataresponse?.data as any)?.data ?? []

    if (!hasScreenViewAccess(userCommand, SERVICE_REQUESTS_MODULE_PATH)) {
        throw new ServiceRequestAccessError('You do not have permission to access this service request.', 403)
    }
}
