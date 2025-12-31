// utils/status.ts
export const isDeleted = (s?: string) => ['D', 'DELETE', 'DELETED'].includes((s || '').toUpperCase());
export const isActive = (s?: string) => ['A', 'ACTIVE'].includes((s || '').toUpperCase());
export const isModify = (s?: string) => ['E', 'EDIT', 'EDITED'].includes((s || '').toUpperCase());
export const isProcessing = (s?: string) => !isDeleted(s) && !isActive(s);
