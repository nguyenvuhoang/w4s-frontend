import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';

export const CustomerTypeIcon = ({ type }: { type: string | undefined }) => {
    switch (type?.trim().toUpperCase()) {
        case 'C':
            return <PersonIcon sx={{ color: '#045318', mr: 1 }} />;
        case 'L':
            return <PeopleIcon sx={{ color: '#045318', mr: 1 }} />;
        case 'G':
            return <PeopleIcon sx={{ color: '#045318', mr: 1 }} />;
        default:
            return null;
    }
};
