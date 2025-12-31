import TextField from "@mui/material/TextField";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import { inputLabelClasses } from "@mui/material/InputLabel";
import { styled } from "@mui/material/styles";

export const StyledTextField = styled(TextField)({
    [`& .${outlinedInputClasses.root} .${outlinedInputClasses.notchedOutline}`]: {
        fontFamily: "Quicksand"
    },
    [`&:hover .${outlinedInputClasses.root} .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: "#ffffff",
        fontFamily: "Quicksand"
    },
    [`& .${outlinedInputClasses.root}.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: "#ffffff",
        fontFamily: "Quicksand"
    },
    [`& .${outlinedInputClasses.input}`]: {
        color: "white",
        fontFamily: "Quicksand"
    },
    [`&:hover .${outlinedInputClasses.input}`]: {
        color: "#ffffff",
        fontFamily: "Quicksand"
    },
    [`& .${outlinedInputClasses.root}.${outlinedInputClasses.focused} .${outlinedInputClasses.input}`]: {
        color: "white",
        fontFamily: "Quicksand"
    },
    [`& .${inputLabelClasses.outlined}`]: {
        color: "white",
        fontFamily: "Quicksand"
    },
    [`&:hover .${inputLabelClasses.outlined}`]: {
        color: "#ffffff",
        fontFamily: "Quicksand"
    },
    [`& .${inputLabelClasses.outlined}.${inputLabelClasses.focused}`]: {
        color: "#ffffff",
        fontFamily: "Quicksand"
    }
});
