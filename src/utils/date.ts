// utils/date.ts
export const toDateOnly = (iso?: string) => (iso ? iso.split('T')[0] : '');
