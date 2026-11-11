'use client'

import { useMemo } from 'react'

import type { Locale as JoyrideLocale, Step } from 'react-joyride'

import type { getDictionary } from '@/shared/utils/getDictionary'
import FeatureTour from '@/shared/components/onboarding/FeatureTour'
import TourTriggerButton from '@/shared/components/onboarding/TourTriggerButton'

const TOUR_ID = 'resident-import-tour'
const TOUR_VERSION = 1

type FullDictionary = Awaited<ReturnType<typeof getDictionary>>

// Import tour steps live in the same `resident` dictionary namespace as ResidentListTour's
// `tour_step_*` keys, so they use a distinct `tour_import_step_*` prefix to avoid colliding.
const importTourText = (dictionary: FullDictionary, key: string, fallback: string) => (dictionary as any).resident?.[key] ?? fallback
const tourText = (dictionary: FullDictionary, key: string, fallback: string) => (dictionary as any).tour?.[key] ?? fallback

type Props = {
    dictionary: FullDictionary
    userCode?: string | null
    hasSelectedProject: boolean
    isBusy: boolean
    /** Only true once a file has been validated and the workbook was parsed client-side. */
    canDownloadEditedFile: boolean
}

const ResidentImportTour = ({
    dictionary,
    userCode,
    hasSelectedProject,
    isBusy,
    canDownloadEditedFile
}: Props) => {
    const steps: Step[] = useMemo(() => {
        const baseSteps: Step[] = [
            {
                target: 'body',
                placement: 'center',
                title: importTourText(dictionary, 'tour_import_step_intro_title', 'Thêm cư dân hàng loạt'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_intro_content',
                    'Bạn có thể tải file Excel, kiểm tra dữ liệu, sửa lỗi trực tiếp và import cư dân hàng loạt. Hãy cùng xem qua các bước chính.'
                )
            },
            {
                target: '[data-tour="resident-import-template"]',
                title: importTourText(dictionary, 'tour_import_step_template_title', 'Tải file mẫu'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_template_content',
                    'Nên sử dụng file mẫu (template) của hệ thống để đảm bảo đúng cấu trúc cột khi import.'
                )
            },
            {
                target: '[data-tour="resident-import-source"]',
                title: importTourText(dictionary, 'tour_import_step_source_title', 'Chọn nguồn dữ liệu'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_source_content',
                    'Chọn tải lên file Excel hoặc dán trực tiếp dữ liệu đã copy từ Excel.'
                )
            },
            {
                target: '[data-tour="resident-import-upload"]',
                title: importTourText(dictionary, 'tour_import_step_upload_title', 'Tải file lên'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_upload_content',
                    'Kéo thả hoặc chọn file Excel để tải lên. Hệ thống hỗ trợ định dạng .xlsx, .xls và .xlsm.'
                )
            },
            {
                target: '[data-tour="resident-import-validate"]',
                title: importTourText(dictionary, 'tour_import_step_validate_title', 'Kiểm tra dữ liệu'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_validate_content',
                    'Nhấn để hệ thống kiểm tra dữ liệu trước khi import, giúp phát hiện các dòng thiếu hoặc sai thông tin.'
                )
            },
            {
                target: '[data-tour="resident-import-summary"]',
                title: importTourText(dictionary, 'tour_import_step_summary_title', 'Kết quả kiểm tra'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_summary_content',
                    'Xem nhanh tổng số dòng, số dòng hợp lệ và số dòng lỗi. Các dòng lỗi sẽ luôn được tự động đưa lên đầu bảng để bạn dễ xử lý.'
                )
            },
            {
                target: '[data-tour="resident-import-table"]',
                title: importTourText(dictionary, 'tour_import_step_table_title', 'Sửa dữ liệu lỗi trực tiếp'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_table_content',
                    'Với các dòng bị lỗi, nhấn Sửa để chỉnh sửa trực tiếp trên bảng. Sau khi Lưu, hệ thống sẽ tự động kiểm tra lại dòng đó.'
                )
            },
            {
                target: '[data-tour="resident-import-edit-action"]',
                title: importTourText(dictionary, 'tour_import_step_edit_action_title', 'Sửa lỗi tại cột Thao tác'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_edit_action_content',
                    'Các dòng lỗi có thể được chỉnh sửa trực tiếp. Nhấn Sửa tại cột Thao tác, cập nhật dữ liệu và nhấn Lưu để hệ thống kiểm tra lại. Khi chỉnh sửa Mã căn hộ, bạn có thể tìm kiếm và chọn căn hộ thuộc dự án hiện tại. Danh sách được tải tự động theo từ khóa tìm kiếm.'
                )
            }
        ]

        if (canDownloadEditedFile) {
            baseSteps.push({
                target: '[data-tour="resident-import-download-edited"]',
                title: importTourText(dictionary, 'tour_import_step_download_title', 'Tải file đã chỉnh sửa'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_download_content',
                    'Mọi thay đổi đã Lưu trên bảng đều được cập nhật vào file Excel gốc. Nhấn để tải file đã chỉnh sửa về máy.'
                )
            })
        }

        baseSteps.push(
            {
                target: '[data-tour="resident-import-submit"]',
                title: importTourText(dictionary, 'tour_import_step_submit_title', 'Import dữ liệu'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_submit_content',
                    'Chỉ có thể import khi toàn bộ dữ liệu đã hợp lệ, không còn dòng lỗi.'
                )
            },
            {
                target: 'body',
                placement: 'center',
                title: importTourText(dictionary, 'tour_import_step_end_title', 'Hoàn tất hướng dẫn'),
                content: importTourText(
                    dictionary,
                    'tour_import_step_end_content',
                    'Bạn có thể xem lại hướng dẫn này bất cứ lúc nào bằng nút "Hướng dẫn sử dụng" ở góc màn hình.'
                )
            }
        )

        return baseSteps
    }, [dictionary, canDownloadEditedFile])

    const joyrideLocale: JoyrideLocale = {
        back: tourText(dictionary, 'back', 'Quay lại'),
        next: tourText(dictionary, 'next', 'Tiếp tục'),
        nextWithProgress: tourText(dictionary, 'next_with_progress', 'Tiếp tục ({current}/{total})'),
        last: tourText(dictionary, 'finish', 'Hoàn thành'),
        skip: tourText(dictionary, 'skip', 'Bỏ qua')
    }

    const autoStart = hasSelectedProject && !isBusy

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

export default ResidentImportTour
