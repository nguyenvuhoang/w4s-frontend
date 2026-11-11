import renderPage from '@/features/properties/floor/FloorDetailRoutePage.server'

export default function Page(props: Parameters<typeof renderPage>[0]) {
  return renderPage(props)
}
