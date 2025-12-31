export const normalizeLang = (lang?: string) =>
  (lang ?? 'en').toLowerCase().split('-')[0] // 'vi-VN' -> 'vi'
