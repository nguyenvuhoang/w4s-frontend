import { Dispatch, SetStateAction } from "react";

export const handleFormClear = (setFormData: Dispatch<SetStateAction<{
    [key: string]: any;
}>>) => {
    setFormData({});
};
