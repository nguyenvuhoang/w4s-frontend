export const parseMultilingualCaption = (
  mCaption: string | null | undefined,
  locale: string
): string | null => {
  if (!mCaption) return null

  try {
    const captions = JSON.parse(mCaption) as Record<string, unknown>
    const localizedCaption = captions[locale]

    return typeof localizedCaption === 'string'
      ? localizedCaption.trim() || null
      : null
  } catch {
    return null
  }
}
