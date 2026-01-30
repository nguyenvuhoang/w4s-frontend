import { getDictionary } from "./getDictionary"

const generateTitleTopup = (dictionary: Awaited<ReturnType<typeof getDictionary>>, title: string) => {
    switch (title) {
        case 'phone-recharge':
            return dictionary['topup'].rechargephone
        default:
            return dictionary['topup'].rechargephone
    }
}

export default generateTitleTopup
