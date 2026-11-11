import renderPage from '@/features/properties/unit/ApartmentDetailRoutePage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props, true)
}
