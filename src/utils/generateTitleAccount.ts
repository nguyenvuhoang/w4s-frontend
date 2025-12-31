import { getDictionary } from "./getDictionary"

const GenerateTitleAccount = (dictionary: Awaited<ReturnType<typeof getDictionary>>, title: string) => {
    switch (title) {
        case 'account':
            return dictionary['account'].account
        case 'wallet':
            return dictionary['account'].wallet
        case 'account-carlist':
            return dictionary['account'].accountcarlist
        default:
            return dictionary['account'].account
    }
}

export default GenerateTitleAccount
