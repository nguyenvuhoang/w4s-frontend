import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import SwalAlert from '@utils/SwalAlert';
import { getDictionary } from '@utils/getDictionary';

export const handlePostExportData = async (
    txFo_: any,
    selectedRowsTableSearchRef: any,
    dictionary?: Awaited<ReturnType<typeof getDictionary>>,
    allRows?: any[]
): Promise<boolean> => {
    try {
        const dataToExport = (allRows && allRows.length > 0) ? allRows : (selectedRowsTableSearchRef || []);

        if (dataToExport.length === 0) {
            if (dictionary) {
                SwalAlert('warning', dictionary['common']?.pleaseselectrow || 'Please select rows to export', 'center');
            } else {
                SwalAlert('warning', 'Please select rows to export', 'center');
            }
            return false;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Exported Data');

        // Extract columns from the first row of data
        const firstRow = dataToExport[0];
        const columns = Object.keys(firstRow).map(key => ({
            header: key.charAt(0).toUpperCase() + key.slice(1),
            key: key,
            width: 20
        }));

        worksheet.columns = columns;

        // Header styling
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF119455' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Add rows
        dataToExport.forEach((item: any) => {
            const row = worksheet.addRow(item);
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const filename = `Export_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
        saveAs(blob, filename);

        return true;
    } catch (error) {
        console.error('handlePostExportData error:', error);
        if (dictionary) {
            SwalAlert('error', dictionary['common']?.servererror || 'Export failed', 'center');
        } else {
            SwalAlert('error', 'Export failed', 'center');
        }
        return false;
    }
};
