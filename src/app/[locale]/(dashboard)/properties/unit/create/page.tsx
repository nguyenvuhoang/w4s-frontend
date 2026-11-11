import renderPage from '@/features/properties/unit/ApartmentCreateRoute.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
