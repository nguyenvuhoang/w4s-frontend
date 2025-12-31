import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';

export const ContractTypeIcon = ({ type }: { type: string | undefined }) => {
    switch (type) {
        case 'IND':
            return <PersonIcon sx={{ color: '#045318', mr: 1 }} />;
        case 'COP':
            return <PeopleIcon sx={{ color: '#045318', mr: 1 }} />;
        default:
            return null;
    }
};
