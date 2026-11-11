'use client'

import { useMemo } from 'react'

import type { Locale as JoyrideLocale, Step } from 'react-joyride'

import FeatureTour from '@/shared/components/onboarding/FeatureTour'
import TourTriggerButton from '@/shared/components/onboarding/TourTriggerButton'

import { residentText, type ResidentDictionary } from './residentListHelpers'

const TOUR_ID = 'resident-list-tour'
const TOUR_VERSION = 1

const tourText = (dictionary: ResidentDictionary, key: string, fallback: string) => (dictionary as any).tour?.[key] ?? fallback

type Props = {
    dictionary: ResidentDictionary
    userCode?: string | null
    canAddResident: boolean
    permissionResolved: boolean
    hasSelectedProject: boolean
    isLoading: boolean
}

const ResidentListTour = ({
    dictionary,
    userCode,
    canAddResident,
    permissionResolved,
    hasSelectedProject,
    isLoading
}: Props) => {
    const steps: Step[] = useMemo(() => {
        const baseSteps: Step[] = [
            {
                target: 'body',
                placement: 'center',
                title: residentText(dictionary, 'tour_step_intro_title', 'Chào mừng đến màn hình Quản lý cư dân'),
                content: residentText(
                    dictionary,
                    'tour_step_intro_content',
                    'Màn hình này giúp bạn tra cứu, tìm kiếm và quản lý cư dân theo từng dự án. Hãy cùng xem qua các khu vực chính.'
                )
            },
            {
                target: '[data-tour="current-project-info"]',
                title: residentText(dictionary, 'tour_step_project_title', 'Dự án đang làm việc'),
                content: residentText(
                    dictionary,
                    'tour_step_project_content',
                    'Đây là dự án hiện tại đang được chọn. Nhấn vào đây để đổi sang dự án khác khi cần.'
                )
            },
            {
                target: '[data-tour="resident-search"]',
                title: residentText(dictionary, 'tour_step_search_title', 'Tìm kiếm cư dân'),
                content: residentText(
                    dictionary,
                    'tour_step_search_content',
                    'Nhập tên, mã cư dân, số điện thoại, email hoặc CCCD/CMND để tìm nhanh cư dân cần xem.'
                )
            },
            {
                target: '[data-tour="building-filter"]',
                title: residentText(dictionary, 'tour_step_building_filter_title', 'Lọc theo tòa nhà'),
                content: residentText(
                    dictionary,
                    'tour_step_building_filter_content',
                    'Chọn một tòa nhà cụ thể để thu hẹp danh sách cư dân đang xem.'
                )
            },
            {
                target: '[data-tour="resident-role-filter"]',
                title: residentText(dictionary, 'tour_step_role_filter_title', 'Lọc theo vai trò cư dân'),
                content: residentText(
                    dictionary,
                    'tour_step_role_filter_content',
                    'Lọc theo vai trò như chủ hộ, người thuê, thành viên hoặc người đại diện.'
                )
            },
            {
                target: '[data-tour="resident-refresh"]',
                title: residentText(dictionary, 'tour_step_refresh_title', 'Làm mới danh sách'),
                content: residentText(
                    dictionary,
                    'tour_step_refresh_content',
                    'Nhấn để xóa các điều kiện lọc và tải lại danh sách cư dân mới nhất.'
                )
            }
        ]

        if (canAddResident) {
            baseSteps.push({
                target: '[data-tour="resident-add"]',
                title: residentText(dictionary, 'tour_step_add_title', 'Thêm cư dân mới'),
                content: residentText(
                    dictionary,
                    'tour_step_add_content',
                    'Nếu bạn có quyền, nhấn nút này để tạo hồ sơ cư dân mới cho dự án đang chọn.'
                )
            })
        }

        baseSteps.push(
            {
                target: '[data-tour="resident-table"]',
                title: residentText(dictionary, 'tour_step_table_title', 'Bảng danh sách cư dân'),
                content: residentText(
                    dictionary,
                    'tour_step_table_content',
                    'Nhấp đúp vào một dòng để xem chi tiết cư dân đó.'
                )
            },
            {
                target: 'body',
                placement: 'center',
                title: residentText(dictionary, 'tour_step_end_title', 'Hoàn tất hướng dẫn'),
                content: residentText(
                    dictionary,
                    'tour_step_end_content',
                    'Bạn có thể xem lại hướng dẫn này bất cứ lúc nào bằng nút "Hướng dẫn sử dụng" ở góc màn hình.'
                )
            }
        )

        return baseSteps
    }, [dictionary, canAddResident])

    const joyrideLocale: JoyrideLocale = {
        back: tourText(dictionary, 'back', 'Quay lại'),
        next: tourText(dictionary, 'next', 'Tiếp tục'),
        nextWithProgress: tourText(dictionary, 'next_with_progress', 'Tiếp tục ({current}/{total})'),
        last: tourText(dictionary, 'finish', 'Hoàn thành'),
        skip: tourText(dictionary, 'skip', 'Bỏ qua')
    }

    const autoStart = hasSelectedProject && permissionResolved && !isLoading

    return (
        <FeatureTour
            tourId={TOUR_ID}
            version={TOUR_VERSION}
            steps={steps}
            autoStart={autoStart}
            userCode={userCode}
            locale={joyrideLocale}
        >
            {({ start }) => (
                <TourTriggerButton
                    label={tourText(dictionary, 'trigger_button', 'Hướng dẫn sử dụng')}
                    onClick={start}
                    disabled={!hasSelectedProject}
                />
            )}
        </FeatureTour>
    )
}

export default ResidentListTour
