/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { systemServiceApi } from '@/servers/system-service'
import { PageContentProps } from '@/types'
import { isValidResponse } from '@/utils/isValidResponse'
import ContentWrapper from '@/views/components/layout/content-wrapper'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Button from '@mui/material/Button'
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    LinearProgress,
    Paper,
    Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField,
    Typography
} from '@mui/material'
import dayjs from 'dayjs'
import { Session } from 'next-auth'
import { useCallback, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'

/** Helpers */
const tnToBool = (v?: string | boolean | null) =>
    typeof v === 'boolean' ? v : String(v || '').trim().toUpperCase() === 'T'

const safe = (s?: string | null) => (s ?? '').toString().trim() || '-'
const fmtDate = (d?: string | null) => (d ? dayjs(d).format('YYYY-MM-DD') : '-')
const isBlocked = (code?: string, caption?: string) => {
    const c = String(code || '').trim().toUpperCase()
    const cap = String(caption || '')
    // Adjust list as needed for your core statuses
    return ['B', 'BLK', 'BLOCK', 'LOCK', 'L'].includes(c) || /block/i.test(cap)
}

/** Domain types (mapped from your API payload) */
type ContractAccount = {
    accountNumber: string
    accountType?: string
    currency?: string
    status?: string
    statusCaption?: string
    isPrimary?: boolean
    branchId?: string
}

type CustomerInfo = {
    fullName?: string
    dob?: string
    sex?: string
    phone?: string
    email?: string
    idTypeCaption?: string
    idNumber?: string
    address?: string
}

type ContractInfo = {
    contractNo: string
    status: string
    statusCaption?: string
    productId?: string
    contractType?: string
    contractTypeCaption?: string
    createdDate?: string
    endDate?: string
    userCreate?: string
    userApprove?: string
    branchId?: string
    controlType?: string
    isAutoRenew?: boolean
    isReceiverList?: boolean
    levelId?: number
    policyId?: number
    userLevel?: string
    userGroup?: string
    parentContract?: string
    transactionId?: string
    accounts: ContractAccount[]
    customer: CustomerInfo | null
    raw?: any
}

/** ========= API hooks ========= **/
async function apiFetchContractByNo(contractNo: string, session: Session | null): Promise<ContractInfo | null> {
    if (!contractNo || contractNo.length < 5) return null

    const dataviewAPI = await systemServiceApi.viewData({
        sessiontoken: session?.user?.token as string,
        learnapi: 'cbs_workflow_execute',
        workflowid: 'SYS_EXECUTE_SQL',
        commandname: 'contractmanagementview',
        issearch: false,
        parameters: { id: contractNo }
    })

    if (!isValidResponse(dataviewAPI)) return null
    const fo = dataviewAPI?.payload?.dataresponse?.fo
    const first = fo?.[0]?.input?.data?.[0]
    if (!first) return null

    // Map payload (based on sample you sent)
    const accounts: ContractAccount[] = (first.contractaccount ?? []).map((a: any) => ({
        accountNumber: safe(a.accountnumber),
        accountType: safe(a.accounttype),
        currency: safe(a.currencycode),
        status: safe(a.status),
        statusCaption: safe(a.statuscaption),
        isPrimary: !!a.isprimary,
        branchId: safe(a.branchid)
    }))

    const custRaw = (first.customer ?? [])[0]
    const customer: CustomerInfo | null = custRaw
        ? {
            fullName: safe(custRaw.fullname),
            dob: fmtDate(custRaw.dob),
            sex: safe(custRaw.sex),
            phone: safe(custRaw.tel),
            email: safe(custRaw.email),
            idTypeCaption: safe(custRaw.licensetypecaption),
            idNumber: safe(custRaw.licenseid),
            address: safe(custRaw.addrresident)
        }
        : null

    const mapped: ContractInfo = {
        contractNo: safe(first.contractnumber),
        status: safe(first.status),                    // e.g. A / B / ...
        statusCaption: safe(first.statuscaption),      // e.g. Active / Blocked ...
        productId: safe(first.productid),
        contractType: safe(first.contracttype),
        contractTypeCaption: safe(first.contracttypecaption),
        createdDate: first.createdate,
        endDate: first.enddate,
        userCreate: safe(first.usercreate),
        userApprove: safe(first.userapprove),
        branchId: safe(first.branchid),
        controlType: safe(first.controltype),
        isAutoRenew: tnToBool(first.isautorenew),
        isReceiverList: tnToBool(first.isreceiverlist),
        levelId: Number(first.contractlevelid ?? 0),
        policyId: Number(first.policyid ?? 0),
        userLevel: safe(first.userlevel),
        userGroup: safe(first.usergroup),
        parentContract: safe(first.parentcontract),
        transactionId: safe(first.transactionid),
        accounts,
        customer,
        raw: first
    }

    return mapped
}

async function apiUnblockContract(
    contractNo: string,
    session: Session | null
): Promise<{ ok: boolean; message?: string }> {
    if (!contractNo) return { ok: false, message: 'Missing contract number' }

    try {
        const updateAPI = await systemServiceApi.viewData({
            sessiontoken: session?.user?.token as string,
            learnapi: 'cbs_workflow_execute',
            workflowid: 'SYS_EXECUTE_SQL',
            commandname: 'UNBLOCKCONTRACT',
            issearch: false,
            parameters: { id: contractNo }
        })

        if (!isValidResponse(updateAPI)) {
            return { ok: false, message: 'Invalid response from server' }
        }

        const dr = updateAPI?.payload?.dataresponse

        if (Array.isArray(dr?.error) && dr.error.length > 0) {
            const e = dr.error[0] || {}
            const execId = e.execute_id ? `[${e.execute_id}] ` : ''
            return { ok: false, message: `${execId}${e.info || 'Execution error'}` }
        }

        const row = dr?.fo?.[0]?.input?.data?.[0]

        const norm = (v: any) => String(v ?? '').trim()
        const upper = (v: any) => norm(v).toUpperCase()
        const boolish = (v: any) => {
            const u = upper(v)
            return (
                v === true ||
                u === 'T' ||
                u === 'Y' ||
                u === 'TRUE' ||
                u === 'OK' ||
                u === 'SUCCESS' ||
                u === 'A' ||
                u === '0'
            )
        }

        const pick = (obj: any, keys: string[]) => {
            if (!obj) return undefined
            for (const k of keys) {
                const hit = Object.keys(obj).find(x => x.toLowerCase() === k.toLowerCase())
                if (hit) return obj[hit]
            }
            return undefined
        }

        let ok = true
        let message: string | undefined

        if (row) {
            const success = pick(row, ['success', 'ok', 'isSuccess', 'result', 'status'])
            const code = pick(row, ['resultcode', 'code', 'rc'])
            const affected = Number(pick(row, ['affectedrows', 'rowcount', 'rows']) ?? 0)
            const msg =
                pick(row, ['message', 'resultmessage', 'resultmsg', 'info', 'errmsg', 'error'])
            ok =
                boolish(success) ||
                upper(code) === '0' ||
                affected > 0 ||
                (success === undefined && code === undefined && affected === 0)

            message = norm(msg) || (ok ? 'Unblock done' : 'Unblock failed')
        } else {
            ok = true
        }

        return { ok, message }
    } catch (err: any) {
        console.error('[UNBLOCKCONTRACT] error', err)
        return { ok: false, message: err?.message || 'Unexpected error' }
    }
}

/** ================================= **/

const ContractManagementUnblockContent = ({ dictionary, session, locale }: PageContentProps) => {
    const [contractNo, setContractNo] = useState('')
    const [isFetching, setIsFetching] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [data, setData] = useState<ContractInfo | null>(null)
    const [isUnblocking, setIsUnblocking] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const canUnblock = useMemo(() => {
        if (!data) return false
        return isBlocked(data.status, data.statusCaption)
    }, [data])

    const handleLookup = useCallback(async () => {
        const trimmed = contractNo.trim()
        if (!trimmed) {
            setData(null)
            setFetchError(null)
            return
        }
        setIsFetching(true)
        setFetchError(null)
        try {
            const res = await apiFetchContractByNo(trimmed, session)
            if (!res) {
                setData(null)
                setFetchError(dictionary['contract'].notfound ?? 'Contract not found')
            } else {
                setData(res)
            }
        } catch (err: any) {
            console.error('[unblock:lookup] error', err)
            setData(null)
            setFetchError(dictionary['common'].servererror)
        } finally {
            setIsFetching(false)
        }
    }, [contractNo, dictionary, session])

    const handleClear = () => {
        setContractNo('')
        setData(null)
        setFetchError(null)
        inputRef.current?.focus()
    }

    const handleUnblock = useCallback(async () => {
        if (!data) return
        const result = await Swal.fire({
            text: (dictionary['contract'].unblock_confirm_text || 'Unblock contract {0}?')
                .replace('{0}', data.contractNo),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: dictionary['common']?.confirm ?? 'Confirm',
            cancelButtonText: dictionary['common']?.cancel ?? 'Cancel',
            reverseButtons: true,
            focusCancel: true,
            buttonsStyling: true,
            confirmButtonColor: '#225087',
            cancelButtonColor: '#6b7280',
        })

        if (!result.isConfirmed) return

        try {
            setIsUnblocking(true)
            const res = await apiUnblockContract(data.contractNo, session)
            if (res.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: dictionary['contract'].unblock_success ?? 'Unblocked successfully',
                    text: res.message || dictionary['contract'].unblock_success_desc || 'The contract has been unblocked.',
                    confirmButtonText: dictionary['common'].confirm
                })
                // refresh local status to ACTIVE
                setData(prev => (prev ? { ...prev, status: 'A', statusCaption: 'Active' } : prev))
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: dictionary['common']?.error,
                    text: res.message || dictionary['contract'].unblock_error || 'Unable to unblock this contract.',
                    confirmButtonText: dictionary['common']?.confirm ?? 'OK'
                })
            }
        } catch (err: any) {
            console.error('[unblock:action] error', err)
            await Swal.fire({
                icon: 'error',
                title: dictionary['common']?.error,
                text: err?.message || dictionary['common'].error
            })
        } finally {
            setIsUnblocking(false)
        }
    }, [data, dictionary])

    return (
        <ContentWrapper
            title={`${dictionary['contract'].title} - ${dictionary['common'].unblock}`}
            description={dictionary['contract'].description}
            icon={<LockOpenIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 2, width: 'min(1080px, 100%)' }} className="mx-auto">
                {/* Search */}
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardHeader
                        title={
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <SearchRoundedIcon />
                                <Typography variant="h6">{dictionary['common']?.search}</Typography>
                            </Stack>
                        }
                        subheader={dictionary['contract']?.search_sub ?? 'Enter a contract number and move focus away to look it up.'}
                    />
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                                <TextField
                                    inputRef={inputRef}
                                    value={contractNo}
                                    onChange={e => setContractNo(e.target.value)}
                                    onBlur={handleLookup}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') e.currentTarget.blur()
                                    }}
                                    label={dictionary['contract']?.contractnumber}
                                    placeholder="e.g. 00040006AF574E50"
                                    fullWidth
                                    size="small"
                                    autoComplete="off"
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchRoundedIcon />
                                                </InputAdornment>
                                            ),
                                            endAdornment: contractNo ? (
                                                <InputAdornment position="end">
                                                    <IconButton aria-label="clear" edge="end" onClick={handleClear}>
                                                        <ClearRoundedIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : undefined
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                                    {isFetching ? (
                                        <Stack sx={{ minWidth: 160 }}>
                                            <Typography variant="caption" sx={{ mb: 0.5 }}>
                                                {dictionary['common']?.loading ?? 'Loading...'}
                                            </Typography>
                                            <LinearProgress />
                                        </Stack>
                                    ) : data ? (
                                        <Chip
                                            icon={<VerifiedRoundedIcon />}
                                            label={isBlocked(data.status, data.statusCaption)
                                                ? (dictionary['contract']?.status_blocked ?? 'Blocked')
                                                : (data.statusCaption ?? 'Active')}
                                            color={isBlocked(data.status, data.statusCaption) ? 'warning' : 'primary'}
                                            variant="filled"
                                        />
                                    ) : fetchError ? (
                                        <Chip icon={<WarningAmberRoundedIcon />} label={dictionary['contract']?.notfound ?? 'Not found'} color="error" variant="outlined" />
                                    ) : (
                                        <Chip icon={<InfoOutlinedIcon />} label={dictionary['common']?.idle ?? 'Idle'} />
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>

                        {fetchError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {fetchError}
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Results */}
                <Box sx={{ mt: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: data ? 3 : 0, border: data ? 'none' : '1px dashed #e0e0e0' }}>
                        {data ? (
                            <>
                                <CardHeader
                                    title={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <InfoOutlinedIcon />
                                            <Typography variant="h6">{dictionary['contract']?.details ?? 'Contract details'}</Typography>
                                        </Stack>
                                    }
                                    action={
                                        <Button
                                            variant="contained"
                                            loading={isUnblocking}
                                            disabled={!canUnblock}
                                            onClick={handleUnblock}
                                            startIcon={<LockOpenIcon />}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                px: 2,
                                                backgroundColor: canUnblock ? '#225087' : undefined,
                                                '&:disabled': { opacity: 0.5 }
                                            }}
                                        >
                                            {dictionary['common']?.unblock ?? 'Unblock'}
                                        </Button>
                                    }
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#225087' }}>
                                        {dictionary['contract']?.title}
                                    </Typography>
                                    <Grid container spacing={4}>
                                        {/* Summary left */}

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoRow label={dictionary['contract']?.contractnumber ?? 'Contract number'} value={data.contractNo} />
                                            <InfoRow label={dictionary['contract']?.type ?? 'Type'} value={`${data.contractTypeCaption || data.contractType || '-'}`} />
                                            <InfoRow label={dictionary['contract']?.product ?? 'Product'} value={data.productId || '-'} />
                                            <InfoRow label={dictionary['contract']?.createdate ?? 'Create date'} value={fmtDate(data.createdDate)} />
                                            <InfoRow label={dictionary['contract']?.expireddate ?? 'End date'} value={fmtDate(data.endDate)} />
                                        </Grid>

                                        {/* Summary right */}
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoRow label={dictionary['contract']?.status ?? 'Status'} value={data.statusCaption || data.status} />
                                            <InfoRow label={dictionary['contract']?.branch ?? 'Branch'} value={data.branchId || '-'} />
                                            <InfoRow label={dictionary['contract']?.usercreated ?? 'User create'} value={data.userCreate || '-'} />
                                            <InfoRow label={dictionary['contract']?.userapprove ?? 'User approve'} value={data.userApprove || '-'} />
                                        </Grid>
                                        <Divider />
                                        {/* Accounts */}
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#225087' }}>
                                                {dictionary['common']?.accounts ?? 'Accounts'}
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small" aria-label="accounts">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>{dictionary['account']?.accountnumber ?? 'Account number'}</TableCell>
                                                            <TableCell>{dictionary['account']?.accounttype ?? 'Type'}</TableCell>
                                                            <TableCell>{dictionary['account']?.currentbalance ?? 'Currency'}</TableCell>
                                                            <TableCell>{dictionary['account']?.accountstatus ?? 'Status'}</TableCell>
                                                            <TableCell align="center">{dictionary['account']?.primary ?? 'Primary'}</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {data.accounts?.length ? (
                                                            data.accounts.map((acc, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>{acc.accountNumber}</TableCell>
                                                                    <TableCell>{acc.accountType}</TableCell>
                                                                    <TableCell>{acc.currency}</TableCell>
                                                                    <TableCell>{acc.statusCaption || acc.status}</TableCell>
                                                                    <TableCell align="center">
                                                                        {acc.isPrimary ? <Chip size="small" color="primary" label={dictionary['common']?.yes ?? 'Yes'} /> : '-'}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                                                                    {dictionary['account']?.empty ?? 'No accounts'}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Grid>
                                        <Divider />
                                        {/* Customer */}
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, color: '#225087' }}>
                                                {dictionary['customer']?.title ?? 'Customer'}
                                            </Typography>
                                            {data.customer ? (
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <InfoRow label={dictionary['customer']?.fullname ?? 'Full name'} value={data.customer.fullName} />
                                                        <InfoRow label={dictionary['customer']?.dob ?? 'DOB'} value={data.customer.dob} />
                                                        <InfoRow label={dictionary['customer']?.gender ?? 'Gender'} value={data.customer.sex} />
                                                        <InfoRow label={dictionary['customer']?.phonenumber ?? 'Phone'} value={data.customer.phone} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <InfoRow label={dictionary['customer']?.email ?? 'Email'} value={data.customer.email} />
                                                        <InfoRow label={dictionary['customer']?.idtype ?? 'ID type'} value={data.customer.idTypeCaption} />
                                                        <InfoRow label={dictionary['customer']?.idnumber ?? 'ID number'} value={data.customer.idNumber} />
                                                        <InfoRow label={dictionary['customer']?.address ?? 'Address'} value={data.customer.address} />
                                                    </Grid>
                                                </Grid>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    {dictionary['customer']?.empty ?? 'No customer info'}
                                                </Typography>
                                            )}
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </>
                        ) : (
                            <CardContent>
                                <Stack spacing={1} alignItems="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    <InfoOutlinedIcon />
                                    <Typography variant="body2" align="center">
                                        {dictionary['contract']?.empty_state ?? 'Search a contract to see its details here.'}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        )}
                    </Card>
                </Box>
            </Box>
        </ContentWrapper>
    )
}

/** Small info row helper */
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75, gap: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 140 }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, textAlign: 'right' }}>
            {value || '-'}
        </Typography>
    </Stack>
)

export default ContractManagementUnblockContent
