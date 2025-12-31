import numbro from 'numbro';
import { ToWords } from 'to-words';

const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    VND: '₫',
    JPY: '¥',
    GBP: '£',
    LAK: '₭',
    KHR: '៛'
};
function getCurrencySymbol(currencyCode: string) {
    return currencySymbols[currencyCode] || currencyCode; // Fallback to the currency code if no symbol is found
}

export function formatCurrency(value: number, currencyCode: string) {
    const currencySymbol = getCurrencySymbol(currencyCode);

    return numbro(value).formatCurrency({
        thousandSeparated: true,
        currencySymbol: currencySymbol
    });
}

const toWords = new ToWords({
    localeCode: 'en-US', // Locale code for language
    converterOptions: {
        currency: true,
        ignoreDecimal: false,
        ignoreZeroCurrency: false,
        doNotAddOnly: false,
    },
});

// Helper function for converting numbers to words in Vietnamese

function numberToWordsVN(value: number): string {
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['mười', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const scales = ['', 'nghìn', 'triệu', 'tỷ'];

    if (value === 0) return 'không đồng';

    let result = '';
    let groupIndex = 0;

    function convertGroupToWords(group: number): string {
        const hundreds = Math.floor(group / 100);
        const tensValue = Math.floor((group % 100) / 10);
        const onesValue = group % 10;

        let result = '';

        if (hundreds > 0) {
            result += `${units[hundreds]} trăm `;
        }

        if (tensValue > 1) {
            result += `${tens[tensValue]} `;
            if (onesValue === 1) {
                result += 'mốt';
            } else if (onesValue === 5) {
                result += 'lăm';
            } else if (onesValue > 0) {
                result += units[onesValue];
            }
        } else if (tensValue === 1) {
            result += `mười ${onesValue === 5 ? 'lăm' : units[onesValue]}`;
        } else if (onesValue > 0) {
            result += `${units[onesValue]}`;
        }

        return result.trim();
    }

    while (value > 0) {
        const group = value % 1000;
        if (group > 0) {
            result = `${convertGroupToWords(group)} ${scales[groupIndex]} ${result}`.trim();
        }
        value = Math.floor(value / 1000);
        groupIndex++;
    }

    return result.trim() + ' đồng';
}

// Helper function for converting numbers to words in Lao
function numberToWordsLAO(value: number): string {
    const units = [
        'ສູນ',  // 0
        'ໜຶ່ງ', // 1
        'ສອງ',  // 2
        'ສາມ',  // 3
        'ສີ່',  // 4
        'ຫ້າ',  // 5
        'ຫົກ',  // 6
        'ເຈັດ', // 7
        'ແປດ',  // 8
        'ເກົາ', // 9
    ];

    const tens = [
        '',         // 0
        'ສິບ',      // 10
        'ຊາວ',     // 20
        'ສາມສິບ',  // 30
        'ສີ່ສິບ',  // 40
        'ຫ້າສິບ',  // 50
        'ຫົກສິບ',  // 60
        'ເຈັດສິບ', // 70
        'ແປດສິບ', // 80
        'ເກົາສິບ', // 90
    ];

    const hundreds = [
        '',                   // 0
        'ໜື່ງຮ້ອຍ',          // 100
        'ສອງຮ້ອຍ',          // 200
        'ສາມຮ້ອຍ',          // 300
        'ສີ່ຮ້ອຍ',          // 400
        'ຫ້າຮ້ອຍ',          // 500
        'ຫົກຮ້ອຍ',          // 600
        'ເຈັດຮ້ອຍ',         // 700
        'ແປດຮ້ອຍ',         // 800
        'ເກົາຮ້ອຍ',         // 900
    ];

    const thousands = [
        '',                   // 0
        'ໜື່ງພັນ',          // 1000
        'ສອງພັນ',          // 2000
        'ສາມພັນ',          // 3000
        'ສີ່ພັນ',          // 4000
        'ຫ້າພັນ',          // 5000
        'ຫົກພັນ',          // 6000
        'ເຈັດພັນ',         // 7000
        'ແປດພັນ',         // 8000
        'ເກົາພັນ',         // 9000
    ];

    const tenThousands = [
        '',                   // 0
        'ສິບພັນ',          // 10000
        'ສອງສິບພັນ',      // 20000
        'ສາມສິບພັນ',      // 30000
        'ສີ່ສິບພັນ',      // 40000
        'ຫ້າສິບພັນ',      // 50000
        'ຫົກສິບພັນ',      // 60000
        'ເຈັດສິບພັນ',     // 70000
        'ແປດສິບພັນ',     // 80000
        'ເກົາສິບພັນ',     // 90000
    ];

    const million = 'ລ້ານ';

    if (value === 0) return 'ສູນ';

    let result = '';

    // Parse millions
    if (value >= 1000000) {
        const millionsPart = Math.floor(value / 1000000);
        result += `${units[millionsPart] || ''} ${million} `;
        value %= 1000000;
    }

    // Parse hundreds of thousands (e.g., 100,000 is "ໜື່ງແສນ")
    if (value >= 100000) {
        const hundredThousandsPart = Math.floor(value / 100000);
        result += `${units[hundredThousandsPart] || ''} ແສນ `;
        value %= 100000;
    }

    // Parse ten thousands
    if (value >= 10000) {
        const tenThousandsPart = Math.floor(value / 10000);
        result += `${tenThousands[tenThousandsPart] || ''} `;
        value %= 10000;
    }

    // Parse thousands
    if (value >= 1000) {
        const thousandsPart = Math.floor(value / 1000);
        result += `${thousands[thousandsPart] || ''} `;
        value %= 1000;
    }

    // Parse hundreds
    if (value >= 100) {
        const hundredsPart = Math.floor(value / 100);
        result += `${hundreds[hundredsPart] || ''} `;
        value %= 100;
    }

    // Parse tens
    if (value >= 10) {
        const tensPart = Math.floor(value / 10);
        if (value === 11) {
            result += 'ສິບເອັດ ';
            value = 0; // 11 is a special case
        } else {
            result += `${tens[tensPart] || ''} `;
        }
        value %= 10;
    }

    // Parse units
    if (value > 0) {
        result += units[value] || '';
    }

    return result.trim();
}


export function convertCurrencyToWords(value: number, currencyCode: string) {
    if (currencyCode === 'VND') {
        return `${numberToWordsVN(value)} đồng`;
    } else if (currencyCode === 'LAK') {
        return `${numberToWordsLAO(value)} ກີບ`;
    } else if (currencyCode === 'USD') {
        return toWords.convert(value, { currency: true });
    } else {
        return value.toString(); // Default fallback if no currency match
    }
}