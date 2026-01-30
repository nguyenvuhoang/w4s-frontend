import { env } from '@/env.mjs'
import { SMSContentType } from '@shared/types/bankType'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const FONT_FAMILY = 'NotoSansLao'
const base = env.NEXT_PUBLIC_APP_URL ?? ''
const FONT_REGULAR_PATH = `${base}/assets/fonts/NotoSansLao-Regular.ttf`
const FONT_BOLD_PATH = `${base}/assets/fonts/NotoSansLao-Bold.ttf`

function looksLikeTTF(buf: ArrayBuffer) {
    const dv = new DataView(buf)
    const tag = dv.getUint32(0, false)
    if (tag === 0x00010000) return true
    const u8 = new Uint8Array(buf.slice(0, 4))
    const sig = String.fromCharCode(...u8)
    return sig === 'true' || sig === 'typ1'
}

function arrayBufferToBase64(buf: ArrayBuffer) {
    const bytes = new Uint8Array(buf)
    const chunk = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return btoa(binary)
}

async function loadTTF(path: string) {
    const resp = await fetch(path)
    if (!resp.ok) throw new Error(`Fetch failed ${path}: ${resp.status}`)
    const buf = await resp.arrayBuffer()
    if (!looksLikeTTF(buf)) {
        throw new Error(`Not a valid TTF at ${path} (maybe 404 HTML/variable font?)`)
    }
    return arrayBufferToBase64(buf)
}


async function ensureLaoFonts(doc: jsPDF) {
    const [regB64, boldB64] = await Promise.all([
        loadTTF(FONT_REGULAR_PATH),
        loadTTF(FONT_BOLD_PATH)
    ])
    console.log(doc.getFontList())

    doc.addFileToVFS('NotoSansLao-Regular.ttf', regB64)
    doc.addFileToVFS('NotoSansLao-Bold.ttf', boldB64)
    doc.addFont('NotoSansLao-Regular.ttf', FONT_FAMILY, 'normal')
    doc.addFont('NotoSansLao-Bold.ttf', FONT_FAMILY, 'bold')

    const fl = doc.getFontList() as Record<string, string[]>
    if (!fl[FONT_FAMILY] || fl[FONT_FAMILY].length === 0) {
        throw new Error(`Font family '${FONT_FAMILY}' not registered`)
    }
    if (!fl[FONT_FAMILY].includes('normal')) {
        throw new Error(`Font '${FONT_FAMILY}' missing 'normal' style`)
    }

    doc.setFont(FONT_FAMILY, 'normal')
}

export const exportToPDF = async (data: SMSContentType[]) => {
    const safeData = Array.isArray(data) ? data : [];

    const doc = new jsPDF('landscape')
    await ensureLaoFonts(doc)
    const now = dayjs().format('DD/MM/YYYY HH:mm:ss')
    const pageWidth = doc.internal.pageSize.getWidth()

    // Logo (náº¿u cÃ³ base64)
    const logoImageBase64 = 'data:image/png;base64,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' // ðŸ‘ˆ Báº¡n cÃ³ thá»ƒ preload báº±ng FileReader/require hoáº·c tá»« API náº¿u logo lÃ  áº£nh
    const logoWidth = 65
    const logoHeight = 20
    const logoX = 14
    const logoY = 10

    if (logoImageBase64) {
        doc.addImage(logoImageBase64, 'PNG', logoX, logoY, logoWidth, logoHeight)
    }

    // TiÃªu Ä‘á»
    doc.setFontSize(18)
    doc.setFont(FONT_FAMILY, 'bold')
    doc.setTextColor(0, 128, 0) // xanh lÃ¡ cÃ¢y
    doc.text('PSVB SMS Gateway Report', pageWidth / 2, 20, { align: 'center' })

    // NgÃ y xuáº¥t
    doc.setFontSize(12)
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Export Date: ${now}`, pageWidth / 2, 28, { align: 'center' })
    // Table export
    autoTable(doc, {
        startY: 35,
        head: [[
            'Phone',
            'Provider',
            'Status',
            'Sent At',
            'Message'
        ]],
        body: safeData.map(row => [
            row.phonenumber,
            row.smsproviderid,
            row.status,
            new Date(row.sentat).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }),
            row.messagecontent
        ]),
        styles: {
            fontSize: 10,
            cellPadding: 3,
            overflow: 'linebreak',
            font: FONT_FAMILY,
        },
        columnStyles: {
            4: { cellWidth: 100 } // Message content column
        },
        headStyles: {
            fillColor: [17, 148, 85], // MÃ u xanh primary
            textColor: [255, 255, 255],
            halign: 'center',
            font: FONT_FAMILY,
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        didDrawPage: (data) => {
            const pageSize = doc.internal.pageSize
            const pageHeight = pageSize.height
            const pageWidth = pageSize.width

            const pageNumber = doc.getNumberOfPages() // âœ… Sá»­a chá»— nÃ y
            doc.setFont(FONT_FAMILY, 'normal')
            doc.setFontSize(10)
            doc.text(
                `Page ${pageNumber}`,
                pageWidth - 40,
                pageHeight - 10
            )
        }

    })
    doc.save(`[PSVB-SMS-REPORT]-${dayjs().format('YYYYMMDD-HHmmss')}.pdf`)
}

