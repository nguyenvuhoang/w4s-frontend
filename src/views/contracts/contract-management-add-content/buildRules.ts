import { requiredFields } from "./requiredFields";

export const buildRules = (
    field: string,
    dictionary: any,
    extra?: Record<string, any>
) => {
    if (!requiredFields[field]) return extra ?? {};

    return {
        required: dictionary['common'].fieldrequired.replace(
            '{field}',
            dictionary['contract'][field] || field
        ),
        ...extra,
    };
};
