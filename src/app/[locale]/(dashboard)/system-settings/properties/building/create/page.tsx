import renderPage from '@/features/properties/building/BuildingCreateRoute.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props, true)
}
