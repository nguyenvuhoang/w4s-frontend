import { FormInput } from "@shared/types/systemTypes";

export const isFieldRequired = (input: FormInput): boolean => {
    return input.validate.request;
};

