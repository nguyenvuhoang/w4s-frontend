'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { getDictionary } from '@utils/getDictionary'

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
}
const FooterContent = ({ dictionary }: Props) => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{`Â© ${new Date().getFullYear()}, ${dictionary['common'].power} `}</span>
        <span>{`â¤ï¸`}</span>
        <span className='text-textSecondary'>{` by `}</span>
        <Link href='https://jits.com.vn' target='_blank' className='text-primary capitalize '>
          JITS
        </Link>
      </p>
      {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          <Link href='/term-and-service' target='_blank' className='text-primary '>
            {dictionary['footer'].termandservice}
          </Link>
          <Link href='/fee-schedule' target='_blank' className='text-primary '>
            {dictionary['footer'].feeschedule}
          </Link>
          <Link
            href='/user-guide'
            target='_blank'
            className='text-primary'
          >
            {dictionary['footer'].userguide}
          </Link>
          <Link href='/safe-transaction-guidelines' target='_blank' className='text-primary '>
            {dictionary['footer'].safetransactionguideline}
          </Link>
        </div>
      )}
    </div>
  )
}

export default FooterContent

