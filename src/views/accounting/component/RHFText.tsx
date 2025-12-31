import { Labeled } from "@/components/Labeled";
import { TextField, TextFieldProps } from "@mui/material";
import { Controller, RegisterOptions } from "react-hook-form";
import { FormValues } from "./FormValues";

export const RHFText = ({
    name,
    label,
    placeholder,
    required = false,
    rules,
    textFieldProps,
}: {
    name: keyof FormValues;
    label: string;
    placeholder?: string;
    required?: boolean;
    rules?: RegisterOptions<FormValues, any>;
    textFieldProps?: Omit<TextFieldProps, "value" | "onChange" | "onBlur" | "error">;
}) => {
    const computedRules = rules ?? (required ? { required: `${label} is required` } : undefined);
    const showStar =
        !!required ||
        (computedRules && typeof (computedRules as any).required !== "undefined");

    return (
        <Controller
            name={name as any}
            defaultValue={"" as any} 
            rules={computedRules}
            render={({ field, fieldState }) => (
                <Labeled label={label} required={showStar} error={fieldState.error?.message}>
                    <TextField
                        fullWidth
                        size="medium"
                        placeholder={placeholder || label}
                        value={field.value ?? ""}    // ✅ never undefined
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={!!fieldState.error}
                        {...textFieldProps}
                    />
                </Labeled>
            )}
        />
    );
};
