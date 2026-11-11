import renderPage from '@/features/properties/floor/FloorPage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
