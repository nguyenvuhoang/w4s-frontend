import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import dayjs from 'dayjs'
import { SMSContentType } from '@shared/types/bankType'
import { getBase64FromPublic } from '@utils/getBase64FromPublic'

export const exportToExcel = async (data: SMSContentType[]) => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('SMS Report', {
        views: [{ state: 'normal', showGridLines: true, rightToLeft: false, zoomScale: 100 }]
    })

    const now = dayjs().format('DD/MM/YYYY HH:mm:ss')

    // ðŸŸ¢ 1. Load logo
    const logoBase64 = await getBase64FromPublic('/images/logobank/psvblogo.png')
    const imageId = workbook.addImage({
        base64: logoBase64,
        extension: 'png'
    })

    // ðŸŸ¢ 2. Add logo A1:A4
    worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 160, height: 70 } // TÄƒng kÃ­ch thÆ°á»›c logo
    })

    // ðŸŸ¢ 3. Merge vÃ  táº¡o tiÃªu Ä‘á» tá»« B1 Ä‘áº¿n F1
    worksheet.mergeCells('A1:E1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'PSVB SMS Gateway Report'
    titleCell.font = { name: 'Century Gothic', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF119455' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(1).height = 45


    // ðŸŸ¢ 4. Export date
    worksheet.mergeCells('B2:F2')
    const dateCell = worksheet.getCell('B2')
    dateCell.value = `Export Date: ${now}`
    dateCell.font = { name: 'Century Gothic', size: 12, italic: true, color: { argb: 'FF555555' } }
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(2).height = 20


    // ðŸŸ¢ 5. Header row (Row 4)
    const headerRow = worksheet.getRow(3)
    headerRow.getCell(1).value = 'Phone'
    headerRow.getCell(2).value = 'Provider'
    headerRow.getCell(3).value = 'Status'
    headerRow.getCell(4).value = 'Sent At'
    headerRow.getCell(5).value = 'Message'

    for (let i = 1; i <= 5; i++) {
        const cell = headerRow.getCell(i)
        cell.font = {
            bold: true,
            name: 'Century Gothic',
            color: { argb: 'FFFFFFFF' }
        }
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF119455' }
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
    headerRow.height = 24

    // ðŸŸ¢ 6. Cáº¥u hÃ¬nh column chÃ­nh xÃ¡c (tá»« B Ä‘áº¿n F)
    worksheet.columns = [
        { key: 'phonenumber', width: 18 },
        { key: 'smsproviderid', width: 12 },
        { key: 'status', width: 10 },
        { key: 'sentat', width: 22 },
        { key: 'messagecontent', width: 50 }
    ]

    // ðŸŸ¢ 7. Add dá»¯ liá»‡u tá»« row 5
    data.forEach(item => {
        const row = worksheet.addRow({
            phonenumber: item.phonenumber,
            smsproviderid: item.smsproviderid,
            status: item.status,
            sentat: dayjs(item.sentat).format('DD/MM/YYYY, HH:mm:ss'),
            messagecontent: item.messagecontent
        })
        row.eachCell(cell => {
            cell.font = { name: 'Century Gothic' }
            cell.alignment = { vertical: 'middle', wrapText: true }
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        })
        row.height = 20
    })

    // ðŸŸ¢ 8. áº¨n cá»™t dÆ° tá»« G trá»Ÿ Ä‘i
    for (let col = 6; col <= 50; col++) {
        worksheet.getColumn(col).hidden = true
    }

    // ðŸŸ¢ 9. Export file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `[PSVB-SMS-REPORT]-${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`)
}

