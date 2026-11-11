import renderPage from '@/features/properties/unit/ApartmentEditRoutePage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
