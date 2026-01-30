import { getDictionary } from "./getDictionary"

const GenerateTitleTransfer = (dictionary: Awaited<ReturnType<typeof getDictionary>>, title: string) => {
    switch (title) {
        case 'domestic':
            return dictionary['transfer'].domesticremittance
        case 'internal':
            return dictionary['transfer'].internal
        case 'external':
            return dictionary['transfer'].external
        case 'cash':
            return dictionary['transfer'].cashremittance
        case 'account':
            return dictionary['transfer'].account
        case 'wallet':
            return dictionary['transfer'].wallet
        case 'qr':
            return dictionary['transfer'].transfermethodqr
        case 'schedule':
            return dictionary['transfer'].scheduletransfer
        default:
            return dictionary['transfer'].internal
    }
}

export default GenerateTitleTransfer
