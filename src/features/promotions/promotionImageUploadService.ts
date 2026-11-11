const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

type PreparedPromotionImageUpload = {
  upload_url: string
  image_url: string
}

export const validatePromotionImageFile = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  return file.size > 0
    && file.size <= MAX_IMAGE_SIZE_BYTES
    && ALLOWED_CONTENT_TYPES.includes(file.type)
    && ALLOWED_EXTENSIONS.includes(extension)
}

export const promotionImageUploadService = {
  async upload(file: File, projectId: number): Promise<string> {
    const prepareResponse = await fetch('/api/promotions/image/presign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        file_name: file.name,
        content_type: file.type,
        file_size: file.size
      })
    })
    const prepareJson = await prepareResponse.json().catch(() => ({}))

    if (!prepareResponse.ok || prepareJson?.success === false) {
      throw new Error(prepareJson?.message ?? 'Unable to prepare image upload.')
    }

    const prepared = prepareJson?.data as PreparedPromotionImageUpload
    if (!prepared?.upload_url || !prepared?.image_url) throw new Error('Invalid upload URL response.')

    const uploadResponse = await fetch(prepared.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    })
    if (!uploadResponse.ok) throw new Error('Unable to upload promotion image.')

    return prepared.image_url
  }
}
