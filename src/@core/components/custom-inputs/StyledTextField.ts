import TextField from "@mui/material/TextField";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import { inputLabelClasses } from "@mui/material/InputLabel";
import { styled } from "@mui/material/styles";

export const StyledTextField = styled(TextField)({
    [`& .${outlinedInputClasses.root} .${outlinedInputClasses.notchedOutline}`]: {
        // Remove fontFamily to inherit from dynamic theme

    },
    [`&:hover .${outlinedInputClasses.root} .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: "#ffffff",
        // Remove fontFamily to inherit from dynamic theme

    },
    [`& .${outlinedInputClasses.root}.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: "#ffffff",
        // Remove fontFamily to inherit from dynamic theme

    },
    [`& .${outlinedInputClasses.input}`]: {
        color: "white",
        // Remove fontFamily to inherit from dynamic theme

    },
    [`&:hover .${outlinedInputClasses.input}`]: {
        color: "#ffffff",
        // Remove fontFamily to inherit from dynamic theme

    },
    [`& .${outlinedInputClasses.root}.${outlinedInputClasses.focused} .${outlinedInputClasses.input}`]: {
        color: "white",
        // Remove fontFamily to inherit from dynamic theme

    },
    [`& .${inputLabelClasses.outlined}`]: {
        color: "white",
        // Remove fontFamily to inherit from dynamic theme

    },
    [`&:hover .${inputLabelClasses.outlined}`]: {
        color: "#ffffff",
        // Remove fontFamily to inherit from dynamic theme

    },
    [`& .${inputLabelClasses.outlined}.${inputLabelClasses.focused}`]: {
        color: "#ffffff",
        // Remove fontFamily to inherit from dynamic theme

    }
});
