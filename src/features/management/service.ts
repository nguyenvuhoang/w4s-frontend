import { createMockData } from './mockData'
import type { ManagementListParams, ManagementListResult, ManagementRecord, ManagementScreenConfig } from './types'

let mockStore = createMockData()

const matchesKeyword = (record: ManagementRecord, keyword?: string) => {
  if (!keyword) return true

  const normalized = keyword.trim().toLowerCase()

  return Object.values(record).some(value => String(value ?? '').toLowerCase().includes(normalized))
}

export const managementService = {
  async list(config: ManagementScreenConfig, params: ManagementListParams): Promise<ManagementListResult> {
    // TODO: replace this mock workflow with the endpoint declared in config.endpointTodo.
    const records = mockStore[config.key] ?? []
    const filtered = records.filter(record => {
      const statusMatched = params.status === 'all' || !params.status || record.status === params.status

      return statusMatched && matchesKeyword(record, params.keyword)
    })
    const start = params.page * params.pageSize

    return {
      data: filtered.slice(start, start + params.pageSize),
      total: filtered.length
    }
  },

  async create(config: ManagementScreenConfig, values: ManagementRecord) {
    const now = new Date().toISOString().slice(0, 10)
    const record = {
      ...values,
      id: `${config.key}-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }

    mockStore = {
      ...mockStore,
      [config.key]: [record, ...(mockStore[config.key] ?? [])]
    }

    return record
  },

  async update(config: ManagementScreenConfig, id: string, values: ManagementRecord) {
    const now = new Date().toISOString().slice(0, 10)

    mockStore = {
      ...mockStore,
      [config.key]: (mockStore[config.key] ?? []).map(record =>
        record.id === id ? { ...record, ...values, id, updatedAt: now } : record
      )
    }
  },

  async deactivate(config: ManagementScreenConfig, id: string) {
    await this.update(config, id, { id, status: 'inactive' })
  }
}
