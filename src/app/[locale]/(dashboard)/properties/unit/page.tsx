import renderPage from '@/features/properties/unit/UnitPage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
