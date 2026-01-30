export const getDisplayValue = (key: string, value: string | undefined, dictionary: { [key: string]: string }) => {
    if (!value) return '';

    switch (key) {
        case 'typeofidentitydocument':
            return dictionary['transfer'] || value;

        default:
            return value;
    }
};
