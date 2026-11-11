import renderPage from '@/features/properties/building/BuildingPage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
