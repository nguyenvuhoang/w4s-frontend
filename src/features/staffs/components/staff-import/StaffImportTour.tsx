'use client'

import { useMemo } from 'react'
import type { Locale as JoyrideLocale, Step } from 'react-joyride'

import FeatureTour from '@/shared/components/onboarding/FeatureTour'
import TourTriggerButton from '@/shared/components/onboarding/TourTriggerButton'

import type { StaffDictionary } from '../../types'
import { staffText } from '../staff-list/staffListHelpers'

const TOUR_ID = 'staff-import-tour'
const TOUR_VERSION = 1

type Props = {
    dictionary: StaffDictionary
    userCode?: string | null
    hasSelectedProject: boolean
}

const StaffImportTour = ({ dictionary, userCode, hasSelectedProject }: Props) => {
    const steps: Step[] = useMemo(() => [
        {
            target: 'body',
            placement: 'center',
            title: staffText(dictionary, 'bulk_import_title', 'Thêm/Cập nhật nhiều nhân viên'),
            content: staffText(dictionary, 'tour_import_intro', 'Tải file Excel hoặc dán dữ liệu từ Excel để chuẩn bị tạo nhiều tài khoản nhân viên.')
        },
        {
            target: '[data-tour="staff-import-template"]',
            title: staffText(dictionary, 'import_download_template', 'Tải file mẫu'),
            content: staffText(dictionary, 'tour_import_template', 'Tải file mẫu của hệ thống trước khi chuẩn bị dữ liệu.')
        },
        {
            target: '[data-tour="staff-import-source"]',
            title: staffText(dictionary, 'tour_import_source_title', 'Chọn nguồn dữ liệu'),
            content: staffText(dictionary, 'tour_import_source', 'Chọn tải file Excel hoặc dán dữ liệu đã sao chép từ Excel.')
        },
        {
            target: '[data-tour="staff-import-upload"]',
            title: staffText(dictionary, 'import_upload_title', 'Tải file Excel'),
            content: staffText(dictionary, 'tour_import_upload', 'Kéo thả hoặc chọn file Excel có định dạng .xlsx, .xls hoặc .xlsm.')
        },
        {
            target: '[data-tour="staff-import-validate"]',
            title: staffText(dictionary, 'import_validate_data', 'Kiểm tra dữ liệu'),
            content: staffText(dictionary, 'tour_import_validate', 'Sau khi cấu hình mẫu và quy tắc kiểm tra, hệ thống sẽ kiểm tra dữ liệu trước khi import.')
        },
        {
            target: '[data-tour="staff-import-submit"]',
            title: staffText(dictionary, 'import_submit', 'Import'),
            content: staffText(dictionary, 'tour_import_submit', 'Import chỉ khả dụng sau khi workflow import nhân viên được cấu hình.')
        }
    ], [dictionary])

    const locale: JoyrideLocale = {
        back: dictionary.tour?.back ?? 'Quay lại',
        next: dictionary.tour?.next ?? 'Tiếp tục',
        nextWithProgress: dictionary.tour?.next_with_progress ?? 'Tiếp tục ({current}/{total})',
        last: dictionary.tour?.finish ?? 'Hoàn thành',
        skip: dictionary.tour?.skip ?? 'Bỏ qua'
    }

    return (
        <FeatureTour tourId={TOUR_ID} version={TOUR_VERSION} steps={steps} autoStart={hasSelectedProject} userCode={userCode} locale={locale}>
            {({ start }) => <TourTriggerButton label={dictionary.tour?.trigger_button ?? 'Hướng dẫn sử dụng'} onClick={start} disabled={!hasSelectedProject} />}
        </FeatureTour>
    )
}

export default StaffImportTour
