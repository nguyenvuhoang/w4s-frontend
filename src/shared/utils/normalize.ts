export const normalize = (s: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')   // bỏ dấu tiếng Việt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
