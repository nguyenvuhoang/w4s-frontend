import { styled, TableCell, TableRow } from "@mui/material";

export const StyledTableRow = styled(TableRow)(() => ({
    backgroundColor: '#ffffff',
    '&:nth-of-type(odd)': {
        backgroundColor: '#f9f9f9',
    },

    '& td': {
        color: '#444444 !important',
        border: 'none'
    },

    '&:last-child td, &:last-child th': {
        border: 0,
    },

    cursor: 'pointer',
    transition: 'background-color 0.3s, opacity 0.3s',
    '&:hover': {
        backgroundColor: '#e0f7fa',
        opacity: 0.8,
        border: 'none',
    },
    '&:active': {
        backgroundColor: '#b2ebf2',
        opacity: 1,
    },
    '& td:first-of-type': {
        color: '#444 !important',
        opacity: 1,
    },

    '& td:first-of-type svg': {
        color: '#444 !important',
        opacity: 1,
    }

}));




export const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: '#215086',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
}));
