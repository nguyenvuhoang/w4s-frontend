'use client'

import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { useUserAssignment } from '@/services/useUserAssignment';
import { UserAccount } from '@shared/types/bankType';
import { PageData, Role } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import {
    Box,
    Checkbox,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import Button from '@mui/material/Button';
import { Session } from 'next-auth';


type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    role: PageData<Role>;
    userdata: PageData<UserAccount>;
    session: Session | null;
};


const UserAssignment = ({ dictionary, role, userdata, session }: Props) => {

    const {
        loadingUsers,
        selectedLeft, selectedRight, handleLeftSelect, handleRightSelect,
        filterUserName, setFilterUserName,
        filterFullname, setFilterFullname,
        filterAssignedUserName, setFilterAssignedUserName,
        filterAssignedFullname, setFilterAssignedFullname,
        filteredUsers, filteredAssignedUsers,
        userGroups, selectedUserGroup, setSelectedUserGroup,
        selectedAssignedRoleId, setSelectedAssignedRoleId,
        handleAssignOne, handleAssignMany,
        handleUnassignOne, handleUnassignMany,
        isAssigning,
        toastOpen, toastMessage, toastSeverity, handleCloseToast,
    } = useUserAssignment({ dictionary, role, userdata, session });

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 5 }}>
                <AssignmentIcon sx={{ color: '#225087' }} />
                <Typography variant="h5" gutterBottom color='#225087'>
                    {dictionary['common'].userassignment || 'User Assignment'}
                </Typography>
            </Stack>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                {/* Báº£ng bÃªn trÃ¡i */}
                <Grid size={5}>
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>{dictionary['common'].selectusergroup || 'Select user group'}</InputLabel>
                            <Select
                                displayEmpty
                                value={selectedUserGroup}
                                onChange={(e) => setSelectedUserGroup(String(e.target.value))}
                                label={dictionary['common'].selectusergroup || 'Select user group'}
                                sx={{
                                    '&.MuiOutlinedInput-root': {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#225087a1 !important',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#8e8e8e !important',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#225087 !important',
                                        },
                                        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#d32f2f !important',
                                        },
                                    },
                                }}
                            >
                                {userGroups.map((group) => (
                                    <MenuItem key={group.roleid} value={String(group.roleid)}>
                                        {group.rolename}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <TableContainer component={Paper}
                        sx={{
                            maxHeight: 400,
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: '#225087',
                                borderRadius: '4px',
                                transition: 'background 0.3s ease-in-out',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#074d87',
                            },
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#225087 #f1f1f1',

                        }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#225087', borderRight: '1px solid #ddd', fontFamily: "Quicksand", background: '#225087' }}>
                                        <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: "Quicksand" }}>
                                            {dictionary['common'].nodot}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderRight: '1px solid #ddd', background: '#225087' }} />

                                    <TableCell sx={{ borderRight: '1px solid #ddd', verticalAlign: 'top', py: 1.5, background: '#225087' }} >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: "Quicksand" }}>
                                                {dictionary['common'].username || 'Username'}
                                            </Typography>
                                            <TextField
                                                size="small"
                                                placeholder="Search..."
                                                value={filterUserName}
                                                onChange={(e) => setFilterUserName(e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        style: { fontSize: '12px', height: 32, paddingLeft: 8, color: 'white' }
                                                    }
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                    },
                                                    input: {
                                                        color: 'white',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </TableCell>

                                    <TableCell sx={{ borderRight: '1px solid #ddd', verticalAlign: 'top', py: 1.5, background: '#225087' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: "Quicksand" }}>
                                                {dictionary['common'].fullname || 'Full Name'}
                                            </Typography>
                                            <TextField
                                                size="small"
                                                placeholder="Search..."
                                                value={filterFullname}
                                                onChange={(e) => setFilterFullname(e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        style: { fontSize: '12px', height: 32, paddingLeft: 8 }
                                                    }
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                    },
                                                    input: {
                                                        color: 'white',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </TableCell>

                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loadingUsers ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">Loading users...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers?.map((user, index) => {
                                        console.log(user);
                                        return (
                                            <TableRow
                                                key={user.id}
                                                sx={{
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedLeft.includes(user.id) ? '#e0e0e0' : 'white',
                                                    '& td': {
                                                        borderBottom: '1px solid #e0e0e0',
                                                    },
                                                }}
                                            >
                                                <TableCell
                                                    sx={{ borderRight: '1px solid #e0e0e0', color: '#225087', }}
                                                >
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell
                                                    sx={{ borderRight: '1px solid #e0e0e0', }}
                                                >
                                                    <Checkbox
                                                        checked={selectedLeft.includes(user.id)}
                                                        onChange={() => handleLeftSelect(user.id)}
                                                        sx={
                                                            {
                                                                color: '#225087',
                                                                '&.Mui-checked': {
                                                                    color: '#225087',
                                                                },
                                                            }
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    sx={{ borderRight: '1px solid #e0e0e0', color: '#225087', }}
                                                >{user.username}
                                                </TableCell>
                                                <TableCell
                                                    sx={{ borderRight: '1px solid #e0e0e0', color: '#225087', }}
                                                >{user.fullname}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* NÃºt di chuyá»ƒn giá»¯a hai báº£ng */}
                <Grid size={2} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
                    {selectedLeft.length > 0 && (
                        <Button
                            loading={isAssigning}
                            variant="outlined"
                            onClick={handleAssignOne}
                            sx={{ mb: 1, width: '50%' }}
                        >
                            <ChevronRightIcon />
                        </Button>
                    )}

                    <Button
                        loading={isAssigning}
                        variant="outlined"
                        onClick={handleAssignMany}
                        disabled={selectedLeft.length === 0 || isAssigning}
                        sx={{ mb: 2, width: '50%' }}
                    >
                        <KeyboardDoubleArrowRightIcon />
                    </Button>

                    {selectedRight.length > 0 && (
                        <Button
                            loading={isAssigning}
                            variant="outlined"
                            onClick={handleUnassignOne}
                            sx={{ mb: 1, width: '50%' }}
                        >
                            <ChevronLeftIcon />
                        </Button>
                    )}

                    <Button
                        loading={isAssigning}
                        variant="outlined"
                        onClick={handleUnassignMany}
                        disabled={selectedRight.length === 0 || isAssigning}
                        sx={{ width: '50%' }}
                    >
                        <KeyboardDoubleArrowLeftIcon />
                    </Button>
                </Grid>


                {/* Báº£ng bÃªn pháº£i */}
                <Grid size={5}>
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>{dictionary['common'].selectrole || 'Select role'}</InputLabel>
                            <Select
                                displayEmpty
                                value={selectedAssignedRoleId}
                                onChange={(e) => setSelectedAssignedRoleId(Number(e.target.value))}
                                label={dictionary['common'].selectrole || 'Select role'}
                                sx={{
                                    '&.MuiOutlinedInput-root': {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#225087a1 !important',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#8e8e8e !important',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#225087 !important',
                                        },
                                        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#d32f2f !important',
                                        },
                                    },
                                }}
                            >
                                {role.items.map((role, index) => (
                                    <MenuItem key={index} value={role.roleid}>
                                        {role.rolename}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <TableContainer component={Paper}

                        sx={{
                            maxHeight: 400,
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: '#225087',
                                borderRadius: '4px',
                                transition: 'background 0.3s ease-in-out',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#074d87',
                            },
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#225087 #f1f1f1',
                        }}
                    >
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white', background: '#225087', borderRight: '1px solid #ddd' }}>
                                        {dictionary['common'].nodot}
                                    </TableCell>
                                    <TableCell sx={{ background: '#225087', borderRight: '1px solid #ddd' }} />
                                    <TableCell sx={{ background: '#225087', borderRight: '1px solid #ddd', verticalAlign: 'top', py: 1.5 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: "Quicksand" }}>
                                                {dictionary['common'].username || 'Username'}
                                            </Typography>
                                            <TextField
                                                size="small"
                                                placeholder="Search..."
                                                value={filterAssignedUserName}
                                                onChange={(e) => setFilterAssignedUserName(e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        style: { fontSize: '12px', height: 32, paddingLeft: 8 },
                                                    },
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                    },
                                                    input: {
                                                        color: 'white',
                                                    },
                                                }}

                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ background: '#225087', borderRight: '1px solid #ddd', verticalAlign: 'top', py: 1.5 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: "Quicksand" }}>
                                                {dictionary['common'].fullname || 'Full Name'}
                                            </Typography>
                                            <TextField
                                                size="small"
                                                placeholder="Search..."
                                                value={filterAssignedFullname}
                                                onChange={(e) => setFilterAssignedFullname(e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        style: { fontSize: '12px', height: 32, paddingLeft: 8 },
                                                    },
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: 'white',
                                                        },
                                                    },
                                                    input: {
                                                        color: 'white',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                </TableRow>

                            </TableHead>
                            <TableBody>
                                {filteredAssignedUsers?.map((user, index) => (
                                    <TableRow
                                        key={user.id}
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedRight.includes(user.id) ? '#e0e0e0' : 'white',
                                            '& td': {
                                                borderBottom: '1px solid #e0e0e0',
                                            },
                                        }}
                                    >
                                        <TableCell
                                            sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: "Quicksand" }}
                                        >
                                            {index + 1}
                                        </TableCell>
                                        <TableCell
                                            sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: "Quicksand" }}
                                        >
                                            <Checkbox
                                                checked={selectedRight.includes(user.id)}
                                                onChange={() => handleRightSelect(user.id)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: "Quicksand" }}>{user.username}</TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: "Quicksand" }}>{user.fullname}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
            <SnackbarComponent handleCloseToast={handleCloseToast} toastMessage={toastMessage} toastOpen={toastOpen} toastSeverity={toastSeverity} />

        </Box>
    );
};

export default UserAssignment;
