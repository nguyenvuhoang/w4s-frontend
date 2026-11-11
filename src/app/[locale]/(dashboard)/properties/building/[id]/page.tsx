import renderPage from '@/features/properties/building/BuildingDetailRoutePage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
