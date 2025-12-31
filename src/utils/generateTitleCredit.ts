import { getDictionary } from "./getDictionary"

const generateTitleCredit = (dictionary: Awaited<ReturnType<typeof getDictionary>>, title: string) => {
    switch (title) {
        case 'credit':
            return dictionary['credit'].credit
        default:
            return dictionary['credit'].credit
    }
}

export default generateTitleCredit
