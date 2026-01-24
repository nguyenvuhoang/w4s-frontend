import { IconButton } from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import { FC } from 'react';

interface SelectAppButtonProps {
    onClick: () => void;
}

const SelectAppButton: FC<SelectAppButtonProps> = ({ onClick }) => (
    <IconButton
        onClick={onClick}
        sx={{
            mr: 2,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'grey.300',
            p: 1,
            '&:hover': {
                bgcolor: 'grey.100'
            }
        }}
        aria-label="Chọn ứng dụng khác"
    >
        <AppsIcon sx={{ fontSize: '2.2rem', color: '#ffffff' }} />
    </IconButton>

);

export default SelectAppButton;
