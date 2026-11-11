/**
 * Route này không còn được dùng.
 * Upload document hiện theo luồng presigned PUT:
 *   1. WF_BO_GET_DOCUMENT_UPLOAD_URL  → lấy presigned PUT URL
 *   2. Browser PUT trực tiếp lên https://storage-api.vknight.io.vn
 *   3. WF_BO_CREATE_DOCUMENT          → lưu metadata vào DB
 *
 * Xem documentService.upload_document_files()
 */
export async function POST() {
  return new Response('Not used', { status: 410 })
}
