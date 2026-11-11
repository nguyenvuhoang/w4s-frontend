import { managementScreens } from './config'
import type { ManagementRecord, ManagementScreenConfig } from './types'

const sampleValues: Record<string, unknown> = {
  project: 'O24 Residence',
  building: 'Tower A',
  floor: 'Floor 12',
  unit: 'A-1201',
  category: 'General',
  priority: 'Medium',
  processingStatus: 'Open',
  approvalStatus: 'Pending',
  publishStatus: 'Draft',
  paymentMethod: 'Bank Transfer',
  residentType: 'Tenant',
  role: 'Admin',
  department: 'Operations',
  targetGroup: 'Residents',
  type: 'Homepage',
  cycle: 'Monthly',
  calculationMethod: 'Fixed',
  feeType: 'Management Fee',
  vehicleType: 'Car',
  packageType: 'Parcel',
  transactionType: 'Import',
  warehouse: 'Main Warehouse',
  stage: 'Planning',
  location: 'Lobby',
  address: 'District 1, Ho Chi Minh City',
  email: 'admin@example.com',
  phoneNumber: '+84 900 000 000',
  status: 'active'
}

const valueForField = (screen: ManagementScreenConfig, key: string, index: number) => {
  const prefix = screen.title.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4) || 'IPS'

  if (key.toLowerCase().includes('code') || key.toLowerCase().includes('no')) return `${prefix}-${String(index).padStart(4, '0')}`
  if (key.toLowerCase().includes('name')) return `${screen.title} ${index}`
  if (key === 'title') return `${screen.title} task ${index}`
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) return `2026-06-${String((index % 20) + 1).padStart(2, '0')}`
  if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('fee') || key === 'price') return index * 125000
  if (key.toLowerCase().includes('total') || key.toLowerCase().includes('quantity') || key.toLowerCase().includes('capacity')) return index * 5
  if (key.toLowerCase().includes('index') || key === 'consumption' || key === 'area') return index * 10
  if (key.toLowerCase().includes('default') || key.toLowerCase().includes('required')) return index === 1

  return sampleValues[key] ?? `${screen.title} ${key} ${index}`
}

export const createMockData = () => {
  const data: Record<string, ManagementRecord[]> = {}

  for (const screen of managementScreens) {
    data[screen.key] = Array.from({ length: 18 }, (_, rowIndex) => {
      const index = rowIndex + 1
      const record: ManagementRecord = {
        id: `${screen.key}-${index}`,
        createdAt: '2026-06-01',
        updatedAt: '2026-06-11'
      }

      for (const field of screen.fields) {
        record[field.key] = field.key === 'status' ? (index % 5 === 0 ? 'inactive' : 'active') : valueForField(screen, field.key, index)
      }

      return record
    })
  }

  return data
}
