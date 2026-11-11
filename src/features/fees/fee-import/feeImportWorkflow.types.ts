export type FeeImportFilter = { project_id: number | null; search_text: string; status: string; page_index: number; page_size: number }
export type FeeImportItem = { id: number | null; project_id: number | null; import_code: string; file_name: string; notes: string | null; total_rows: number | null; imported_count: number | null; skipped_count: number | null; updated_count: number | null; error_count: number | null; import_date: string | null; status: string; system_status: string | null; project_name: string | null; fee_period_name: string | null }
export type FeeImportDetail = FeeImportItem
export type FeeImportSearchResponse = { items: FeeImportItem[]; total_count: number; total_pages: number; page_index: number; page_size: number; has_previous_page: boolean; has_next_page: boolean }
export type FeeImportDetailRow = { id: number | null; apartment_code: string | null; fee_type: string | null; document_code: string | null; description: string | null; amount: number | null; outstanding_amount: number | null; system_status: string; error_message: string | null }
export type FeeImportDetailSearchResponse = { items: FeeImportDetailRow[]; period_name: string | null; total_count: number; total_pages: number; page_index: number; page_size: number }
export type FeeImportMutationResult = { id: number | null }
