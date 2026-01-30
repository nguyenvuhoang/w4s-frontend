import { getDictionary } from "./getDictionary"

const GenerateTitleUtility = (dictionary: Awaited<ReturnType<typeof getDictionary>>, title: string) => {
    switch (title) {
        case 'favorite-function':
            return dictionary['utility'].favoritefunction
        case 'verify-method':
            return dictionary['utility'].verifymethod
        default:
            return dictionary['utility'].favoritefunction
    }
}

export default GenerateTitleUtility
