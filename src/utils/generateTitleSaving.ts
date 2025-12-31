import { getDictionary } from "./getDictionary"

const generateTitleSaving = (dictionary: Awaited<ReturnType<typeof getDictionary>>, title: string) => {
    switch (title) {
        case 'saving':
            return dictionary['saving'].saving
        default:
            return dictionary['saving'].saving
    }
}

export default generateTitleSaving
