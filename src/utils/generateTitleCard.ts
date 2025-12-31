import { getDictionary } from "./getDictionary"

const generateTitleCard = (dictionary: Awaited<ReturnType<typeof getDictionary>>, title: string) => {
    switch (title) {
        case 'card':
            return dictionary['card'].card
        case 'credit':
            return dictionary['card'].creditcard
        default:
            return dictionary['card'].card
    }
}

export default generateTitleCard
