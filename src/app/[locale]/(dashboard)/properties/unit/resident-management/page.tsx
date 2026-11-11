import renderPage from '@/features/properties/unit/ApartmentResidentManagementRoutePage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
