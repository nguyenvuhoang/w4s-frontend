// Component Imports
import LayoutFooter from '@layouts/components/vertical/Footer'
import FooterContent from './FooterContent'
import { getDictionary } from '@/utils/getDictionary'


type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const Footer = ({ dictionary }: Props) => {
  return (
    <LayoutFooter>
      <FooterContent dictionary={dictionary} />
    </LayoutFooter>
  )
}

export default Footer
