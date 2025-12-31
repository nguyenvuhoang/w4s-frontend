import { TransactionField } from "@/types/bankType";

export const getValueTransactionField = (listTransactionField: TransactionField[], pos: number, key: string): string => {
    const field = listTransactionField.find((field) => field.pos === pos && field.field_name === key);
    return field ? field.field_value : '';
};
