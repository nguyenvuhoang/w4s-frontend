// Type Imports
import type { VerticalMenuDataType } from '@shared/types/menuTypes'
import type { getDictionary } from '@utils/getDictionary'

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  // This is how you will normally render submenu
  {
    label: "Home",
    icon: 'home.svg'
  },
  {
    label: dictionary['navigation'].transfer,
    icon: 'transfer.svg',
    children: [
      {
        label: dictionary['navigation'].oversearemittance,
        href: '/front-pages/oversea-remittance',
        target: '_blank',
        icon: 'oversearemittance.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].domesticremittance,
        href: '/front-pages/domestic-remittance',
        target: '_blank',
        icon: 'domesticremittance.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].groupremittance,
        href: '/front-pages/group-remittance',
        target: '_blank',
        icon: 'groupremittance.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].cashremittance,
        href: '/front-pages/cash-remittance',
        target: '_blank',
        icon: 'cashremittance.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].cashwithdrawalvnpost,
        href: '/front-pages/cash-withdrawal-vnpost',
        target: '_blank',
        icon: 'cashwithdrawalvnpost.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].scheduletransfer,
        href: '/front-pages/scheduletransfer',
        target: '_blank',
        icon: 'scheduletransfer.png',
        excludeLang: true
      }
    ],
    utilities: [
      {
        label: dictionary['navigation'].setuplimitamount,
        href: '/front-pages/setuplimitamount',
        target: '_blank',
        icon: 'setuplimitamount.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].transfertransactionstatus,
        href: '/front-pages/transfertransactionstatus',
        target: '_blank',
        icon: 'transfertransactionstatus.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].benificiarylist,
        href: '/front-pages/benificiarylist',
        target: '_blank',
        icon: 'benificiarylist.png',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].moneytransferform,
        href: '/front-pages/moneytransferform',
        target: '_blank',
        icon: 'moneytransferform.png',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].billpayment,
    icon: 'billpayment.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].topup,
    icon: 'topup.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].cardservice,
    icon: 'cardservice.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].loan,
    icon: 'loan.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].savings,
    icon: 'savings.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].insurance,
    icon: 'insurance.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].investment,
    icon: 'investment.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].statebudget,
    icon: 'statebudget.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  },
  {
    label: dictionary['navigation'].utilities,
    icon: 'utilities.svg',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      }
    ]
  }
]

export default verticalMenuData

