// Client-side text translation via Google's public "gtx" endpoint — same endpoint browser
// extensions use, no API key required. There is no BE translate workflow for this yet.
const GOOGLE_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single'

// Matches every Vietnamese diacritic letter (upper/lowercase). Used to guess whether the
// system name the user typed is Vietnamese or English, since there is no explicit source
// language field on the create form.
const VIETNAMESE_CHARACTERS_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/

export const isVietnameseText = (text: string) => VIETNAMESE_CHARACTERS_REGEX.test(text)

export type TranslateTargetLang = 'vi' | 'en'

export const translateText = async ({
  text,
  targetLang
}: {
  text: string
  targetLang: TranslateTargetLang
}): Promise<string> => {
  const trimmed = text.trim()

  if (!trimmed) return ''

  const params = new URLSearchParams({ client: 'gtx', sl: 'auto', tl: targetLang, dt: 't', q: trimmed })

  const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?${params.toString()}`)

  if (!response.ok) throw new Error(`Translate request failed with status ${response.status}`)

  const data: unknown = await response.json()
  const chunks = Array.isArray(data) ? data[0] : undefined
  const translated = Array.isArray(chunks)
    ? chunks.map((chunk: unknown) => (Array.isArray(chunk) ? chunk[0] : '')).join('')
    : ''

  if (!translated) throw new Error('Translate response was empty')

  return translated
}
