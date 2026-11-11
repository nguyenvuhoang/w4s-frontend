export function propertyPath(module: 'building' | 'floor' | 'unit', admin: boolean) {
  return `${admin ? '/system-settings' : ''}/properties/${module}`
}
