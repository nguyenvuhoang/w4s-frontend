'use client'

import { OptionIcon } from '@/components/layout/shared/OptionIcon'
import { StatusIcon } from '@/components/layout/shared/StatusIcon'
import LoadingSubmit from '@/components/LoadingSubmit'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { dataService, workflowService } from '@/servers/system-service'
import { UserAccount } from '@/types/bankType'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
    Box,
    Button,
    Card,
    CardContent,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { Fragment, useEffect, useMemo, useState } from 'react'
import UserDetailCard from './UserDetailCard'

type UserDetail = Record<string, any>

const UserAccountInfo = ({
    session,
    contractdata,
    dictionary
}: {
    contractdata: any
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
}) => {
    const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [details, setDetails] = useState<Record<string, UserDetail | null>>({})
    const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({})
    const [detailError, setDetailError] = useState<Record<string, string | undefined>>({})

    const [unblockLoading, setUnblockLoading] = useState<Record<string, boolean>>({})
    const [unblockError, setUnblockError] = useState<Record<string, string | undefined>>({})

    const fetchUserAccounts = async (contractNumber: string) => {
        setLoading(true)
        setError(null)
        try {
            const userAccountApi = await dataService.viewData({
                sessiontoken: session?.user?.token as string,
                learnapi: 'cbs_workflow_execute',
                workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
                commandname: 'getuserbycontractnumber',
                issearch: false,
                parameters: { id: contractNumber }
            })

            if (
                !isValidResponse(userAccountApi) ||
                (userAccountApi.payload.dataresponse.error && userAccountApi.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    userAccountApi.payload.dataresponse.error?.[0]?.execute_id +
                    ' - ' +
                    userAccountApi.payload.dataresponse.error?.[0]?.info
                )
                setError('Failed to load user accounts')
                setUserAccounts([])
                return
            }

            const useraccount = userAccountApi.payload.dataresponse.fo?.[0]?.input?.data
            setUserAccounts(useraccount || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchUserDetail = async (loginname: string) => {
        if (!loginname) return
        setDetailLoading(prev => ({ ...prev, [loginname]: true }))
        setDetailError(prev => ({ ...prev, [loginname]: undefined }))

        try {
            const detailApi = await dataService.viewData({
                sessiontoken: session?.user?.token as string,
                learnapi: 'cbs_workflow_execute',
                workflowid: 'BO_EXECUTE_SQL_FROM_CTH',
                commandname: 'getuserdetailbyloginname',
                issearch: false,
                parameters: { id: loginname }
            })

            if (
                !isValidResponse(detailApi) ||
                (detailApi.payload.dataresponse.error && detailApi.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    detailApi.payload.dataresponse.error?.[0]?.execute_id +
                    ' - ' +
                    detailApi.payload.dataresponse.error?.[0]?.info
                )
                setDetailError(prev => ({ ...prev, [loginname]: 'Failed to load details' }))
                setDetails(prev => ({ ...prev, [loginname]: null }))
                return
            }

            const fo = detailApi.payload.dataresponse.fo?.[0]?.input
            const detailData =
                (Array.isArray(fo?.data) ? fo?.data?.[0] : fo?.data) ?? fo?.result ?? fo?.info ?? {}

            setDetails(prev => ({ ...prev, [loginname]: detailData || {} }))
        } catch (e) {
            setDetailError(prev => ({
                ...prev,
                [loginname]: e instanceof Error ? e.message : 'An error occurred'
            }))
            setDetails(prev => ({ ...prev, [loginname]: null }))
        } finally {
            setDetailLoading(prev => ({ ...prev, [loginname]: false }))
        }
    }

    const handleUnblockUser = async (loginname: string) => {
        if (!loginname) return

        SwalAlert(
            'question',
            `Unblock user ${loginname}?`,
            'center',
            true,
            true,
            true,
            async () => {
                setUnblockLoading(prev => ({ ...prev, [loginname]: true }))
                setUnblockError(prev => ({ ...prev, [loginname]: undefined }))

                try {
                    const res = await workflowService.runFODynamic({
                        sessiontoken: session?.user?.token as string,
                        workflowid: WORKFLOWCODE.BO_UNBLOCK_USER,
                        input: { user_name: loginname }
                    })

                    if (
                        !isValidResponse(res) ||
                        (res.payload.dataresponse.error && res.payload.dataresponse.error.length > 0)
                    ) {
                        console.log(
                            'ExecutionID:',
                            res.payload.dataresponse.error?.[0]?.execute_id +
                            ' - ' +
                            res.payload.dataresponse.error?.[0]?.info
                        )
                        setUnblockError(prev => ({ ...prev, [loginname]: 'Failed to unblock user' }))
                        SwalAlert('error', 'Failed to unblock user', 'center')
                    } else {

                        const isvalidblockuser = res.payload.dataresponse.fo[0].input.data as boolean

                        if (!isvalidblockuser) {
                            setUnblockError(prev => ({ ...prev, [loginname]: 'Failed to unblock user' }))
                            SwalAlert('error', 'Failed to unblock user', 'center')
                            return
                        }
                        
                        await fetchUserDetail(loginname)

                        setUserAccounts(prev =>
                            prev.map(acc => {
                                const key = String((acc as any)?.loginname || '')
                                if (key !== loginname) return acc
                                return {
                                    ...acc,
                                    status: 'A',
                                    statuscaption: 'Active'
                                } as any
                            })
                        )

                        SwalAlert('success', `User ${loginname} has been unblocked`, 'center')
                    }
                } catch (e) {
                    const message = e instanceof Error ? e.message : 'An error occurred'
                    setUnblockError(prev => ({ ...prev, [loginname]: message }))
                    SwalAlert('error', message, 'center')
                } finally {
                    setUnblockLoading(prev => ({ ...prev, [loginname]: false }))
                }
            },
            'Yes, unblock'
        )
    }

    useEffect(() => {
        if (contractdata?.contractnumber) {
            fetchUserAccounts(contractdata.contractnumber)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractdata?.contractnumber])

    const userAccountFields = useMemo(
        () => [
            { key: 'loginname', label: 'Login Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'statuscaption', label: 'Status' },
            { key: 'islogin', label: 'Is Login' },
            { key: 'lastlogintime', label: 'Last Login Time' },
            { key: 'failnumber', label: 'Fail Number' }
        ],
        []
    )

    const handleToggleDetail = (account: UserAccount) => {
        const key = String(account.loginname || '')
        if (!key) return
        const isOpen = !!expanded[key]
        const next = { ...expanded, [key]: !isOpen }
        setExpanded(next)

        if (!isOpen && details[key] === undefined) {
            fetchUserDetail(key)
        }
    }

    const isBlocked = (detail?: UserDetail | null): boolean => {
        const raw =
            String(
                (detail as any)?.status ??
                (detail as any)?.statuscaption ??
                (detail as any)?.userstatus ??
                ''
            ).toLowerCase()
        return ['block', 'blocked', 'lock', 'locked', 'inactive', 'b', 'c'].some(v =>
            raw.includes(v)
        )
    }

    return (
        <Card className="shadow-md">
            <CardContent>
                {loading ? (
                    <LoadingSubmit loadingtext={dictionary['common'].loading} />
                ) : error ? (
                    <Typography className="text-center text-red-500">{error}</Typography>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow className="bg-gray-100">
                                    {userAccountFields.map(field => (
                                        <TableCell key={field.key}>
                                            <Typography className="font-semibold text-gray-700">
                                                {field.label}
                                            </Typography>
                                        </TableCell>
                                    ))}
                                    <TableCell align="center" sx={{ width: 96, whiteSpace: 'nowrap', p: 1 }}>
                                        <Typography className="font-semibold text-gray-700">{dictionary['navigation'].actions}</Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {userAccounts.length > 0 && Object.keys(userAccounts[0] || {}).length > 0 ? (
                                    userAccounts.map((account, index) => {
                                        const key = String((account as any)?.loginname || '')
                                        const open = !!expanded[key]
                                        const detail = details[key]
                                        const showUnblock = open && isBlocked(detail)
                                        return (
                                            <Fragment key={`${key}-${index}`}>
                                                <TableRow className="hover:bg-gray-50">
                                                    {userAccountFields.map(field => (
                                                        <TableCell key={field.key}>
                                                            <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', gap: 1 }}>
                                                                {field.key !== 'islogin' && (
                                                                    <Typography className={`${field.key === 'statuscaption' && isBlocked(detail) ? 'text-red-500 font-semibold' : 'text-gray-700'}`}>
                                                                        {String((account as any)?.[field.key] ?? '-')}
                                                                    </Typography>
                                                                )}
                                                                {field.key === 'statuscaption' && (
                                                                    <StatusIcon status={(account as any)?.status} />
                                                                )}
                                                                {field.key === 'islogin' && (
                                                                    <OptionIcon isOption={(account as any)?.islogin} />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center" sx={{ width: 96, whiteSpace: 'nowrap', p: 1 }}>
                                                        <Box className="flex items-center justify-center">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<VisibilityIcon />}
                                                                onClick={() => handleToggleDetail(account)}
                                                            >
                                                                {open ? 'Hide' : 'View'}
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Row chi tiết */}
                                                <TableRow>
                                                    <TableCell colSpan={userAccountFields.length + 1} sx={{ p: 0, borderBottom: 0 }}>
                                                        <Collapse in={open} timeout="auto" unmountOnExit>
                                                            <UserDetailCard
                                                                data={detail ?? undefined}
                                                                loading={!!detailLoading[key]}
                                                                error={detailError[key]}
                                                                onRetry={() => fetchUserDetail(key)}
                                                                title={`${dictionary['common'].userdetail}`}
                                                                dictionary={dictionary}
                                                            />

                                                            {showUnblock && (
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 2 }}>
                                                                    <Typography variant="body2" color="error">
                                                                        {unblockError[key]}
                                                                    </Typography>
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        color="primary"
                                                                        disabled={!!unblockLoading[key]}
                                                                        onClick={() => handleUnblockUser(key)}
                                                                    >
                                                                        {unblockLoading[key] ? 'Unblocking...' : 'Unblock user'}
                                                                    </Button>
                                                                </Box>
                                                            )}
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </Fragment>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={userAccountFields.length + 1} className="text-center">
                                            <Typography className="text-gray-500">No user accounts available</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    )
}

export default UserAccountInfo
