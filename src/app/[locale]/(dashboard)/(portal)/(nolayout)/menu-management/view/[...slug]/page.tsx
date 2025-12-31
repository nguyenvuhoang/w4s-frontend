import type { Locale } from '@configs/i18n'
import MenuManagementViewContent from '@/views/nolayout/menu-management/view'

type Props = {
  params: Promise<{ locale: Locale; slug: string[] }>
}

export default async function MenuManagementViewPage(props: Props) {
  const params = await props.params
  const { locale, slug } = params
  const id = slug[0]

  return <MenuManagementViewContent locale={locale} id={id} />
}
