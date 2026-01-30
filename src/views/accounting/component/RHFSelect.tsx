import { Labeled } from "@components/Labeled";
import { MenuItem, TextField, TextFieldProps } from "@mui/material";
import { Controller, RegisterOptions } from "react-hook-form";
import { FormValues } from "./FormValues";

type Option = { value: string | number; label: string };

export const RHFSelect = ({
    name,
    label,
    options = [],
    required = false,
    rules,
    textFieldProps,
}: {
    name: keyof FormValues;
    label: string;
    options?: Option[];
    required?: boolean;
    rules?: RegisterOptions<FormValues, any>;
    textFieldProps?: Omit<TextFieldProps, "select" | "value" | "onChange" | "onBlur" | "error" | "name" | "inputRef">;
}) => {
    const computedRules = rules ?? (required ? { required: `${label} is required` } : undefined);
    const labelIsRequired =
        !!required ||
        (!!computedRules &&
            typeof (computedRules as any).required !== "undefined" &&
            (computedRules as any).required !== false);

    return (
        <Controller
            name={name as any}
            rules={computedRules}
            render={({ field, fieldState }) => (
                <Labeled label={label} required={labelIsRequired} error={fieldState.error?.message}>
                    <TextField
                        select
                        fullWidth
                        size="medium"
                        // quan trá»ng: Ä‘á»“ng bá»™ vá»›i RHF
                        name={field.name}
                        inputRef={field.ref}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        error={!!fieldState.error}
                        {...textFieldProps}
                    >
                        {(options ?? [])
                            .filter(Boolean)
                            .map((opt, i) => {
                                const val = String(opt!.value ?? ""); 
                                return (
                                    <MenuItem key={`${val}-${i}`} value={val}>
                                        {opt!.label ?? val}
                                    </MenuItem>
                                );
                            })}
                    </TextField>
                </Labeled>
            )}
        />
    );
};

