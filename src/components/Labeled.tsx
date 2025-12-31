import { Box, FormHelperText, Typography } from "@mui/material";

export const Labeled = ({
    label,
    required = false,
    children,
    error,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    error?: string;
}) => (
    <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {label}
            {required && (
                <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: 'error.main', ml: 0.2 }}
                >
                    *
                </Typography>
            )}
        </Typography>
        {children}
        {error ? <FormHelperText error>{error}</FormHelperText> : null}
    </Box>
);
