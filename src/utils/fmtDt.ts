import { pad2 } from "./pad2"

export const fmtDt = (v: any) => {
    if (!v) return '-'
    const cleaned = String(v).replace(/\s+0$/, '').trim()
    const d = new Date(cleaned)
    if (isNaN(d.getTime())) return String(v)
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}
