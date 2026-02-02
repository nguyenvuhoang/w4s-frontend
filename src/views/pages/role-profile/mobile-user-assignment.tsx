'use client';

import PaginationPage from '@/@core/components/jTable/pagination';
import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { useMobileUserAssignment } from '@/services/useMobileUserAssignment';
import { UserMobileAccount } from '@shared/types/bankType';
import { PageData, Role } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import {
    Box,
    Button,
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
import { Session } from 'next-auth';
import { useSettings } from '@core/hooks/useSettings';

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    role: PageData<Role>;
    userdata: PageData<UserMobileAccount>;
    session: Session | null;
};

const MobileUserAssignment = ({ dictionary, role, userdata, session }: Props) => {
    const { settings } = useSettings();

    const {
        loadingUsers,
        // selections
        selectedLeft,
        selectedRight,
        handleLeftSelect,
        handleRightSelect,
        // filters & setters
        filterUserName,
        setFilterUserName,
        filterFullname,
        setFilterFullname,
        filterAssignedUserName,
        setFilterAssignedUserName,
        filterAssignedFullname,
        setFilterAssignedFullname,
        filteredUsers,
        filteredAssignedUsers,
        // role pickers
        mobileRoles,
        userGroups,
        selectedUserGroup,
        setSelectedUserGroup,
        selectedAssignedRoleId,
        setSelectedAssignedRoleId,
        // pagination
        currentPageLeft,
        pageSizeLeft,
        totalCountLeft,
        totalPagesLeft,
        jumpPageLeft,
        currentPageRight,
        pageSizeRight,
        totalCountRight,
        totalPagesRight,
        jumpPageRight,
        // pagination handlers
        handlePageLeftChange,
        handlePageSizeLeftChange,
        handleJumpPageLeft,
        handlePageRightChange,
        handlePageSizeRightChange,
        handleJumpPageRight,
        // actions
        handleAssignOne,
        handleAssignMany,
        handleUnassignOne,
        handleUnassignMany,
        isAssigning,
        // toast
        toastOpen,
        toastMessage,
        toastSeverity,
        handleCloseToast,
    } = useMobileUserAssignment({
        session,
        dictionary,
        role,
        userdata,
    });
    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 5 }}>
                <AssignmentIcon sx={{ color: '#225087' }} />
                <Typography variant="h5" gutterBottom color='#225087'>
                    {dictionary['common']?.mobileUserAssignment || 'Mobile User Assignment'}
                </Typography>
            </Stack>

            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                {/* Left Table - Available Mobile Users */}
                <Grid size={5}>
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>{dictionary['common']?.selectusergroup || 'Select user group'}</InputLabel>
                            <Select
                                displayEmpty
                                value={selectedUserGroup}
                                onChange={(e) => setSelectedUserGroup(e.target.value as number | string)}
                                label={dictionary['common']?.selectusergroup || 'Select user group'}
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
                                    <MenuItem key={group.roleid} value={group.roleid}>
                                        {group.rolename}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <TableContainer
                        component={Paper}
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
                                background: '#225087',
                            },
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#225087 #f1f1f1',
                        }}
                    >
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#225087', borderRight: '1px solid #ddd', fontFamily: settings.fontFamily, background: '#225087' }}>
                                        <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: settings.fontFamily }}>
                                            {dictionary['common']?.nodot || 'No.'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderRight: '1px solid #ddd', background: '#225087' }} />
                                    <TableCell sx={{ borderRight: '1px solid #ddd', verticalAlign: 'top', py: 1.5, background: '#225087' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: settings.fontFamily }}>
                                                {dictionary['common']?.username || 'Username'}
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
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: settings.fontFamily }}>
                                                {dictionary['common']?.fullname || 'Full Name'}
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
                                            <Typography variant="body2" color="text.secondary">Loading mobile users...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers && filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
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
                                                sx={{ borderRight: '1px solid #e0e0e0', color: '#225087' }}
                                            >
                                                {index + 1}
                                            </TableCell>
                                            <TableCell
                                                sx={{ borderRight: '1px solid #e0e0e0' }}
                                            >
                                                <Checkbox
                                                    checked={selectedLeft.includes(user.id)}
                                                    onChange={() => handleLeftSelect(user.id)}
                                                    sx={{
                                                        color: '#225087',
                                                        '&.Mui-checked': {
                                                            color: '#225087',
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell
                                                sx={{ borderRight: '1px solid #e0e0e0', color: '#225087' }}
                                            >
                                                {user.user_name}
                                            </TableCell>
                                            <TableCell
                                                sx={{ borderRight: '1px solid #e0e0e0', color: '#225087' }}
                                            >
                                                {`${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim() + (user.phone ? ` (${user.phone})` : '')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">No mobile users found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination for Available Mobile Users */}
                    {totalCountLeft > 0 && (
                        <Box mt={5} sx={{ '& .MuiPaginationItem-root.Mui-selected': { backgroundColor: '#225087 !important' } }}>
                            <PaginationPage
                                page={currentPageLeft}
                                pageSize={pageSizeLeft}
                                totalResults={totalCountLeft}
                                jumpPage={jumpPageLeft}
                                handlePageChange={handlePageLeftChange}
                                handlePageSizeChange={handlePageSizeLeftChange}
                                handleJumpPage={handleJumpPageLeft}
                                dictionary={dictionary}
                            />
                        </Box>
                    )}
                </Grid>

                {/* Action Buttons */}
                <Grid size={2} display="flex" alignItems="center" justifyContent="center" flexDirection="column">
                    {selectedLeft.length > 0 && (
                        <Button
                            loading={isAssigning}
                            variant="outlined"
                            onClick={handleAssignOne}
                            disabled={!(selectedAssignedRoleId && selectedAssignedRoleId > 0)}
                            sx={{ mb: 1, width: '50%' }}
                        >
                            <ChevronRightIcon />
                        </Button>
                    )}

                    <Button
                        loading={isAssigning}
                        variant="outlined"
                        onClick={handleAssignMany}
                        disabled={selectedLeft.length === 0 || isAssigning || !(selectedAssignedRoleId && selectedAssignedRoleId > 0)}
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

                {/* Right Table - Assigned Mobile Users */}
                <Grid size={5}>
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>{dictionary['common']?.selectrole || 'Select role'}</InputLabel>
                            <Select
                                displayEmpty
                                value={selectedAssignedRoleId}
                                onChange={(e) => setSelectedAssignedRoleId(e.target.value as number | '')}
                                label={dictionary['common']?.selectrole || 'Select role'}
                                sx={{
                                    '&.MuiOutlinedInput-root': {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#225087 !important',
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
                                {mobileRoles.map((r) => (
                                    <MenuItem key={r.roleid} value={r.roleid}>
                                        {r.rolename}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <TableContainer
                        component={Paper}
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
                                        {dictionary['common']?.nodot || 'No.'}
                                    </TableCell>
                                    <TableCell sx={{ background: '#225087', borderRight: '1px solid #ddd' }} />
                                    <TableCell sx={{ background: '#225087', borderRight: '1px solid #ddd', verticalAlign: 'top', py: 1.5 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: settings.fontFamily }}>
                                                {dictionary['common']?.username || 'Username'}
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
                                            <Typography variant="caption" fontWeight="bold" color="white" sx={{ fontFamily: settings.fontFamily }}>
                                                {dictionary['common']?.fullname || 'Full Name'}
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
                                {filteredAssignedUsers && filteredAssignedUsers.length > 0 ? (
                                    filteredAssignedUsers?.map((user, index) => (
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
                                                sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: settings.fontFamily }}
                                            >
                                                {index + 1}
                                            </TableCell>
                                            <TableCell
                                                sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: settings.fontFamily }}
                                            >
                                                <Checkbox
                                                    checked={selectedRight.includes(user.id)}
                                                    onChange={() => handleRightSelect(user.id)}
                                                    sx={{
                                                        color: '#225087',
                                                        '&.Mui-checked': {
                                                            color: '#225087',
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: settings.fontFamily }}>
                                                {user.user_name}
                                            </TableCell>
                                            <TableCell sx={{ borderRight: '1px solid #ddd', color: '#225087', fontFamily: settings.fontFamily }}>
                                                {`${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim() + (user.phone ? ` (${user.phone})` : '')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">No mobile users by role found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Pagination for Assign Mobile Users */}
                    {totalCountRight > 0 && (
                        <Box mt={5} sx={{ '& .MuiPaginationItem-root.Mui-selected': { backgroundColor: '#225087 !important' } }}>
                            <PaginationPage
                                page={currentPageRight}
                                pageSize={pageSizeRight}
                                totalResults={totalCountRight}
                                jumpPage={jumpPageRight}
                                handlePageChange={handlePageRightChange}
                                handlePageSizeChange={handlePageSizeRightChange}
                                handleJumpPage={handleJumpPageRight}
                                dictionary={dictionary}
                            />
                        </Box>
                    )}
                </Grid>
            </Grid>

            <SnackbarComponent
                handleCloseToast={handleCloseToast}
                toastMessage={toastMessage}
                toastOpen={toastOpen}
                toastSeverity={toastSeverity}
            />
        </Box>
    );
};

export default MobileUserAssignment;
