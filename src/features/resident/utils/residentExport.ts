import ExcelJS from 'exceljs'
import dayjs from 'dayjs'

import type { ResidentModel } from '../types'
import {
    formatResidentDate,
    formatResidentDateTime,
    getResidentAppUsageLabel,
    getResidentGenderDisplay,
    getResidentStatusLabel,
    residentText,
    type ResidentDictionary
} from '../components/resident-list/residentListHelpers'

const RESIDENT_EXPORT_XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const HEADER_FILL_COLOR = 'FF1F6F50'

export async function exportResidentsToExcel(rows: ResidentModel[], dictionary: ResidentDictionary): Promise<void> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(residentText(dictionary, 'list_title', 'Danh sách cư dân'))

    const columns: Array<{ header: string; key: string; width: number }> = [
        { header: residentText(dictionary, 'export_column_resident_code', 'Mã cư dân'), key: 'resident_code', width: 18 },
        { header: residentText(dictionary, 'export_column_full_name', 'Họ tên'), key: 'full_name', width: 26 },
        { header: residentText(dictionary, 'export_column_gender', 'Giới tính'), key: 'gender', width: 12 },
        { header: residentText(dictionary, 'export_column_date_of_birth', 'Ngày sinh'), key: 'date_of_birth', width: 14 },
        { header: residentText(dictionary, 'export_column_phone', 'Số điện thoại'), key: 'phone', width: 16 },
        { header: residentText(dictionary, 'export_column_email', 'Email'), key: 'email', width: 26 },
        { header: residentText(dictionary, 'export_column_identity_number', 'Số giấy tờ'), key: 'identity_number', width: 18 },
        { header: residentText(dictionary, 'export_column_status', 'Trạng thái'), key: 'status', width: 16 },
        { header: residentText(dictionary, 'export_column_app_usage', 'Đã sử dụng App'), key: 'app_usage', width: 16 },
        { header: residentText(dictionary, 'export_column_created_on', 'Ngày tạo'), key: 'created_on', width: 18 }
    ]

    worksheet.columns = columns.map(({ key, width }) => ({ key, width }))

    const headerRow = worksheet.getRow(1)

    columns.forEach((column, index) => {
        const cell = headerRow.getCell(index + 1)

        cell.value = column.header
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
    headerRow.height = 24

    rows.forEach(row => {
        const excelRow = worksheet.addRow({
            resident_code: row.resident_code,
            full_name: row.full_name,
            gender: getResidentGenderDisplay(dictionary, row.gender),
            date_of_birth: formatResidentDate(row.date_of_birth),
            phone: row.phone || '-',
            email: row.email || '-',
            identity_number: row.identity_number || '-',
            status: getResidentStatusLabel(dictionary, row.status),
            app_usage: getResidentAppUsageLabel(dictionary, row.app_usage),
            created_on: formatResidentDateTime(row.created_on_utc)
        })

        excelRow.eachCell(cell => {
            cell.alignment = { vertical: 'middle', wrapText: true }
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        })
    })

    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: RESIDENT_EXPORT_XLSX_MIME_TYPE })
    const { saveAs } = await import('file-saver')

    saveAs(blob, `resident-list-${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`)
}
