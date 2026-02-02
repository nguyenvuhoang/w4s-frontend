import { Box, TextField, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";

interface EditableCellProps {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}

const EditableCell = ({
    value,
    onChange,
    disabled = false,
}: EditableCellProps) => {
    const theme = useTheme();
    const [editingValue, setEditingValue] = useState(value);

    useEffect(() => {
        setEditingValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingValue(e.target.value);
    };

    const handleBlur = () => {
        if (editingValue !== value) {
            onChange(editingValue);
        }
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", position: "relative", width: "100%" }}>
            <TextField
                variant="standard"
                value={editingValue}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={disabled}
                fullWidth
                slotProps={{
                    input: {
                        sx: {
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            backgroundColor: "transparent",
                            fontSize: '0.9rem',
                            "&:before": {
                                borderBottom: `1px solid ${theme.palette.divider} !important`,
                            },
                            "&:after": {
                                borderBottom: `2px solid ${theme.palette.primary.main} !important`,
                            },
                            "&:hover:not(.Mui-disabled, .Mui-error):before": {
                                borderBottom: `2px solid ${theme.palette.primary.main} !important`,
                            },
                            "& .MuiInputBase-input.Mui-disabled": {
                                color: theme.palette.text.disabled,
                                WebkitTextFillColor: theme.palette.text.disabled,
                                opacity: 1,
                            },
                        },
                    },
                }}
            />
        </Box>
    );
};

export default EditableCell;
