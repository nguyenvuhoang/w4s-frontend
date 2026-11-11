import { toDateOnly } from '@/shared/utils/date'

// A birthday is a calendar date. Preserve the date part even when a legacy response
// includes a time/offset; converting that timestamp to local time can change the birthday.
export const toStaffDateInputValue = (value?: string | null): string => {
    const date = toDateOnly(value?.trim())
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)

    if (!match) return ''

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1] ? date : ''
}

export const formatStaffBirthDate = (value?: string | null): string => {
    const date = toStaffDateInputValue(value)

    if (!date) return '-'

    const [year, month, day] = date.split('-')

    return `${day}/${month}/${year}`
}
