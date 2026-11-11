export const DATA_MIGRATION_PATH = '/system-settings/data-migration'
export const DATA_MIGRATION_API = '/api/system-settings/data-migration'

export type DataMigrationOperation = 'export' | 'import'

export const buildDataMigrationExportPayload = (tableNames: readonly string[]) => ({
  table_names: tableNames,
  format: 'Json' as const,
  batch_size: 0 as const
})

export type DataMigrationService = {
  key: string
  code: string
  name: string
}

export const isZipArchive = async (file: Blob) => {
  const [p, k, first, second] = new Uint8Array(await file.slice(0, 4).arrayBuffer())

  if (p !== 80 || k !== 75 || !((first === 3 && second === 4) || (first === 5 && second === 6))) return false

  // The ZIP end record is 22 bytes, followed by a comment of at most 65,535 bytes.
  const tail = new DataView(await file.slice(-65_557).arrayBuffer())

  for (let offset = tail.byteLength - 22; offset >= 0; offset--) {
    if (tail.getUint32(offset, true) === 0x06054b50 &&
      offset + 22 + tail.getUint16(offset + 20, true) === tail.byteLength) return true
  }

  return false
}
