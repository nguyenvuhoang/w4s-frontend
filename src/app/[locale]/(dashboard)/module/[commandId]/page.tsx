import type { Locale } from '@/configs/i18n'
import { getDictionary } from '@/shared/utils/getDictionary'
import ModuleHubContent from '@/shared/components/layout/dashboard/ModuleHubContent'

type ModuleHubPageProps = {
  params: Promise<{
    locale: string
    commandId: string
  }>
}

const ModuleHubPage = async ({ params }: ModuleHubPageProps) => {
  const { locale, commandId } = await params
  const dictionary = await getDictionary(locale as Locale)

  return <ModuleHubContent dictionary={dictionary} locale={locale as Locale} commandId={decodeURIComponent(commandId)} />
}

export default ModuleHubPage
