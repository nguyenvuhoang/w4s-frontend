'use client'

import LoadingSubmit from '@/components/LoadingSubmit'
import Spinner from '@/components/spinners'
import SwalAlert from '@/utils/SwalAlert'

import { dataService, workflowService } from '@/servers/system-service'
import { UserAccount } from '@/types/bankType'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import VpnKeyIcon from '@mui/icons-material/VpnKey'

import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'

type BankAccountLite = {
    accountnumber: string
    accountname?: string
    accounttype?: string
    status?: string | number
}

type AssignedAccount = BankAccountLite & {
    assignedat?: string
}

type Props = {
    contractdata: any
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null

    /** Danh sách bank accounts đã sync (từ tab BankAccountInfo truyền xuống) */
    availableAccounts: BankAccountLite[]
}

const UserAccountAssignment = ({ session, contractdata, dictionary, availableAccounts }: Props) => {
    const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState('')

    const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
    const [assignedAccounts, setAssignedAccounts] = useState<AssignedAccount[]>([])
    const [loadingAssigned, setLoadingAssigned] = useState(false)

    const [selectingAccounts, setSelectingAccounts] = useState<BankAccountLite[]>([])
    const [submittingAssign, setSubmittingAssign] = useState(false)
    const [submittingUnassign, setSubmittingUnassign] = useState<string | null>(null)

    // -------- Fetch user list by contract --------
    const fetchUserAccounts = async (contractNumber: string) => {
        setLoadingUsers(true)
        setError(null)
        try {
            const res = await dataService.viewData({
                sessiontoken: session?.user?.token as string,
                learnapi: 'cbs_workflow_execute',
                workflowid: 'BO_EXECUTE_SQL_FROM_CTH',
                commandname: 'getuserbycontractnumber',
                issearch: false,
                parameters: { id: contractNumber }
            })

            if (!isValidResponse(res) || (res.payload.dataresponse.error && res.payload.dataresponse.error.length > 0)) {
                const err = res.payload.dataresponse.error?.[0]
                console.log('ExecutionID:', err?.execute_id, '-', err?.info)
                setUserAccounts([])
                return
            }

            const items = res.payload.dataresponse.fo?.[0]?.input?.data ?? []
            setUserAccounts(items)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoadingUsers(false)
        }
    }

    // -------- Fetch assigned accounts of selected user --------
    const fetchAssignedAccounts = async (user: UserAccount) => {
        setLoadingAssigned(true)
        try {
            const res = await dataService.viewData({
                sessiontoken: session?.user?.token as string,
                learnapi: 'cbs_workflow_execute',
                workflowid: 'DTS_EXECUTE_SQL',
                commandname: 'getassignedaccountsbyuser',
                issearch: false,
                parameters: {
                    id: user.usercode
                }
            })

            if (!isValidResponse(res) || (res.payload.dataresponse.error && res.payload.dataresponse.error.length > 0)) {
                const err = res.payload.dataresponse.error?.[0]
                console.log('ExecutionID:', err?.execute_id, '-', err?.info)
                setAssignedAccounts([])
                return
            }

            const items: AssignedAccount[] = res.payload.dataresponse.fo?.[0]?.input?.data ?? []
            setAssignedAccounts(items)
        } finally {
            setLoadingAssigned(false)
        }
    }

    // -------- Assign accounts to user --------
    const handleAssign = async () => {
        if (!selectedUser || selectingAccounts.length === 0) return
        setSubmittingAssign(true)
        try {
            const payload = {
                user_code: selectedUser.usercode,
                account_list: selectingAccounts.map(a => a.accountnumber)
            }

            console.log(`payload: ${JSON.stringify(payload)}`);

            // TODO: chỉnh lại workflowid theo hệ thống của bạn
            const res = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token,
                workflowid: 'BO_ASSIGN_USER_ACCOUNTS',
                input: payload
            })

            if (!isValidResponse(res) || res.payload.dataresponse.error?.length) {
                const info = res.payload.dataresponse.error?.[0]?.info ?? 'Assign failed'
                SwalAlert('error', info)
                return
            }

            SwalAlert('success', dictionary['common']?.updated ?? 'Updated successfully')
            // merge list mới
            const newly: AssignedAccount[] = selectingAccounts.map(a => ({ ...a }))
            setAssignedAccounts(prev => {
                const exists = new Set(prev.map(p => p.accountnumber))
                const merged = [...prev]
                for (const n of newly) if (!exists.has(n.accountnumber)) merged.push(n)
                return merged
            })
            setSelectingAccounts([])
        } catch (e) {
            SwalAlert('error', e instanceof Error ? e.message : 'Assign failed')
        } finally {
            setSubmittingAssign(false)
        }
    }

    // -------- Unassign one account --------
    const handleUnassign = async (acc: AssignedAccount) => {
        if (!selectedUser) return
        setSubmittingUnassign(acc.accountnumber)
        try {
            // TODO: chỉnh lại workflowid theo hệ thống của bạn
            const res = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token,
                workflowid: 'BO_UNASSIGN_USER_ACCOUNT',
                input: {
                    loginname: selectedUser.loginname,
                    accountnumber: acc.accountnumber
                }
            })

            if (!isValidResponse(res) || res.payload.dataresponse.error?.length) {
                const info = res.payload.dataresponse.error?.[0]?.info ?? 'Unassign failed'
                SwalAlert('error', info)
                return
            }

            SwalAlert('success', dictionary['common']?.updated ?? 'Updated successfully')
            setAssignedAccounts(prev => prev.filter(p => p.accountnumber !== acc.accountnumber))
        } catch (e) {
            SwalAlert('error', e instanceof Error ? e.message : 'Unassign failed')
        } finally {
            setSubmittingUnassign(null)
        }
    }

    useEffect(() => {
        if (contractdata?.contractnumber) {
            fetchUserAccounts(contractdata.contractnumber)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractdata?.contractnumber])

    useEffect(() => {
        if (selectedUser) fetchAssignedAccounts(selectedUser)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUser?.loginname])

    // Filter user list (left)
    const filteredUsers = useMemo(() => {
        const q = filter.trim().toLowerCase()
        if (!q) return userAccounts
        return userAccounts.filter(u =>
            [u.loginname, u.phone, (u as any).statuscaption]
                .filter(Boolean)
                .some(v => String(v).toLowerCase().includes(q))
        )
    }, [userAccounts, filter])

    // Options for assign (right) = available - already assigned
    const selectableAccounts = useMemo(() => {
        const taken = new Set(assignedAccounts.map(a => a.accountnumber))
        return availableAccounts.filter(a => !taken.has(a.accountnumber))
    }, [availableAccounts, assignedAccounts])

    return (
        <Grid container spacing={2}>
            {/* LEFT: user list */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card className="shadow-md">
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <PersonOutlineIcon fontSize="small" color='primary' />
                            <Typography fontWeight={600} color='#225087'>
                                {dictionary['contract']?.userAccountInfo ?? 'Users'}
                            </Typography>
                        </Stack>

                        <TextField
                            size="small"
                            fullWidth
                            placeholder={dictionary['common']?.search ?? 'Search...'}
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        {loadingUsers ? (
                            <LoadingSubmit loadingtext={dictionary['common'].loading} />
                        ) : error ? (
                            <Typography color="error" align="center">{error}</Typography>
                        ) : (
                            <Paper variant="outlined" sx={{ maxHeight: 480, overflow: 'auto' }}>
                                <List dense disablePadding>
                                    {filteredUsers.length === 0 && (
                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {dictionary['common'].noaccount ?? 'No data available'}
                                            </Typography>
                                        </Box>
                                    )}
                                    {filteredUsers.map((u, idx) => {
                                        const isSelected = selectedUser?.loginname === u.loginname

                                        return (
                                            <ListItemButton
                                                key={`${u.loginname}-${idx}`}
                                                selected={isSelected}
                                                sx={{
                                                    borderRadius: 1,
                                                    '&.Mui-selected, &.Mui-selected:hover': {
                                                        backgroundColor: '#3c836175',
                                                    },
                                                    '& .user-title': { color: '#225087 !important' },
                                                    '& .user-sub': { color: 'rgba(0,0,0,0.65) !important' },
                                                }}
                                                onClick={() => setSelectedUser(u)}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Typography className="user-title" fontWeight={700}>
                                                                {u.loginname}
                                                            </Typography>

                                                            <Chip
                                                                size="small"
                                                                label={u.statuscaption || (u.status ? 'Active' : 'Inactive')}
                                                                color={u.status ? 'primary' : 'default'}
                                                                variant="filled"
                                                                sx={{ height: 22, my: 1 }}
                                                            />
                                                        </Stack>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" className="user-sub">
                                                            {u.phone || '-'}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItemButton>
                                        )

                                    })}

                                </List>
                            </Paper>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* RIGHT: assign area */}
            <Grid size={{ xs: 12, md: 8 }}>
                <Card className="shadow-md">
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <AccountBalanceIcon fontSize="small" color='primary' />
                            <Typography fontWeight={600} color='#225087'>
                                {dictionary['contract']?.bankAccountInfo ?? 'Bank Accounts'}
                            </Typography>
                        </Stack>

                        {!selectedUser ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.primary">
                                    {dictionary['common']?.hintSelectUser ?? 'Select a user from the left to manage account assignments.'}
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                {/* Selected user header */}
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'rgba(12,145,80,0.03)' }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {/* Status */}
                                        <Chip
                                            size="small"
                                            icon={<CheckCircleOutlineIcon />}
                                            label={selectedUser.statuscaption || (selectedUser.status ? 'Active' : 'Inactive')}
                                            color={selectedUser.status ? 'primary' : 'default'}
                                            variant="filled"
                                            sx={{ height: 24 }}
                                        />

                                        {/* Login (dùng key/lock thay vì tick/x) */}
                                        <Chip
                                            size="small"
                                            icon={selectedUser.islogin ? <VpnKeyIcon /> : <BlockIcon />}
                                            label={selectedUser.islogin ? (dictionary['common']?.loginEnabled ?? 'Login enabled')
                                                : (dictionary['common']?.loginDisabled ?? 'Login disabled')}
                                            color={selectedUser.islogin ? 'success' : 'warning'}
                                            variant="outlined"
                                            sx={{ height: 24 }}
                                        />
                                    </Stack>
                                </Paper>

                                {/* Assign control */}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                    <Autocomplete
                                        multiple
                                        size="small"
                                        options={selectableAccounts}
                                        getOptionLabel={(o) =>
                                            [o.accountnumber, o.accountname].filter(Boolean).join(' • ')
                                        }
                                        value={selectingAccounts}
                                        onChange={(_, val) => setSelectingAccounts(val)}
                                        renderInput={(params) => (
                                            <TextField {...params} label={dictionary['common']?.select ?? 'Select'} placeholder="Account..." />
                                        )}
                                        sx={{ flex: 1 }}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<LinkIcon />}
                                        disabled={selectingAccounts.length === 0 || submittingAssign}
                                        onClick={handleAssign}
                                        sx={{ textTransform: 'none', bgcolor: '#225087', '&:hover': { bgcolor: '#1780AC' } }}
                                    >
                                        {submittingAssign
                                            ? (dictionary['common']?.processing ?? 'Processing...')
                                            : (dictionary['common']?.assign ?? 'Assign')}
                                    </Button>
                                </Stack>

                                <Divider sx={{ my: 2 }} />

                                {/* Assigned accounts table */}
                                {loadingAssigned ? (
                                    <Spinner />
                                ) : (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ background: 'rgba(0,0,0,0.03)' }}>
                                                    <TableCell>{dictionary['account'].accountnumber}</TableCell>
                                                    <TableCell>{dictionary['account'].accountname}</TableCell>
                                                    <TableCell>{dictionary['account'].accounttype}</TableCell>
                                                    <TableCell width={120} align="right">
                                                        {dictionary['navigation']?.actions ?? 'Actions'}
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {assignedAccounts.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center">
                                                            <Typography variant="body2" color="text.secondary">
                                                                {dictionary['common']?.nodata ?? 'No data available'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    assignedAccounts.map(acc => (
                                                        <TableRow key={acc.accountnumber} hover>
                                                            <TableCell>{acc.accountnumber}</TableCell>
                                                            <TableCell>{acc.accountname || '-'}</TableCell>
                                                            <TableCell>{acc.accounttype || '-'}</TableCell>
                                                            <TableCell align="right">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<LinkOffIcon />}
                                                                    onClick={() => handleUnassign(acc)}
                                                                    disabled={submittingUnassign === acc.accountnumber}
                                                                    sx={{ textTransform: 'none' }}
                                                                >
                                                                    {submittingUnassign === acc.accountnumber
                                                                        ? (dictionary['common']?.processing ?? 'Processing...')
                                                                        : (dictionary['common']?.remove ?? 'Remove')}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default UserAccountAssignment
