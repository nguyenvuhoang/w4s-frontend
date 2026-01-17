'use client'

import { AccountTypeIcon } from '@/components/layout/shared/AccountTypeIcon';
import { PrimaryIcon } from '@/components/layout/shared/PrimaryIcon';
import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { useBankAccountHandler } from '@/services/useBankAccountHandler';
import { Contract, Contractaccount } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import SyncOverlay from '@/views/components/SyncOverlay';
import { Global } from '@emotion/react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SyncIcon from '@mui/icons-material/Sync';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Collapse,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import { Session } from 'next-auth';
import { Fragment, useEffect, useMemo, useState } from 'react';
import DepositAccountDetail from './DepositAccountDetail';
import FixedDepositAccountDetail from './FixedDepositAccountDetail';
import LoanAccountDetail from './LoanAccountDetail';

type AccountDetail = Record<string, any>;

const accountFields: { key: keyof Contractaccount; label: string }[] = [
    { key: 'accountnumber', label: 'Account Number' },
    { key: 'accounttype', label: 'Account Type' },
    { key: 'currencycode', label: 'Currency Code' },
    { key: 'statuscaption', label: 'Status' },
    { key: 'isprimary', label: 'Primary' },
    { key: 'branchid', label: 'Branch ID' },
    { key: 'bankaccounttype', label: 'Bank Account Type' },
];

const BankAccountInfo = ({
    contractdata,
    dictionary,
    session,
    locale,
}: {
    contractdata: Contract;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    session: Session | null;
    locale?: Locale;
}) => {
    const accounts: Contractaccount[] = contractdata?.contractaccount || [];
    const { loading, handleSync } = useBankAccountHandler({ contract: contractdata, session, dictionary });

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Row open/close state by account number (stable across pagination)
    const [openAccNo, setOpenAccNo] = useState<string | null>(null);

    // Detail caches
    const [details, setDetails] = useState<Record<string, AccountDetail>>({});
    const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
    const [detailError, setDetailError] = useState<Record<string, string>>({});

    // Clamp page when data length changes
    useEffect(() => {
        const total = accounts.length;
        const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
        // Nếu openAccNo không còn trong trang hiện tại, vẫn giữ nguyên; UI sẽ đóng khi chuyển trang
    }, [accounts.length, rowsPerPage, page]);

    // Current page slice
    const pagedAccounts = useMemo(() => {
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        return accounts.slice(start, end);
    }, [accounts, page, rowsPerPage]);

    const fetchAccountDetail = async (acc: Contractaccount) => {
        const accNo = acc.accountnumber || '';
        if (!accNo) return;

        setDetailLoading(prev => ({ ...prev, [accNo]: true }));
        setDetailError(prev => ({ ...prev, [accNo]: '' }));

        try {
            const type = (acc.accounttype ?? '').toUpperCase();

            const workflowid =
                type === 'LN'
                    ? WORKFLOWCODE.BO_GET_LOAN_ACCOUNT_DETAIL
                    : type === 'FD'
                        ? WORKFLOWCODE.BO_GET_FIXED_DEPOSIT_DETAIL
                        : WORKFLOWCODE.BO_GET_DEPOSIT_ACCOUNT_DETAIL;

            const res = await workflowService.runFODynamic({
                sessiontoken: (session?.user as any)?.tokenreal || session?.user?.token || '',
                workflowid,
                input: { account_number: accNo, is_digital: true },
                language: locale || 'en',
            });

            const errors = res?.payload?.dataresponse?.error;
            if (!isValidResponse(res) || (Array.isArray(errors) && errors.length > 0)) {
                const execute_id = Array.isArray(errors) && errors[0]?.execute_id;
                const errorinfo = Array.isArray(errors) && errors[0]?.info;
                if (execute_id || errorinfo) console.log('ExecutionID:', execute_id, '-', errorinfo);
                throw new Error(errorinfo || 'Failed to load account detail');
            }

            const raw = res?.payload?.dataresponse?.fo?.[0]?.input || {};

            if (type === 'LN') {
                setDetails(prev => ({ ...prev, [accNo]: { __kind: 'loan', loaninfo: raw?.loaninfo ?? {} } }));
            } else if (type === 'FD') {
                const src = raw?.fixeddepositinfo ?? raw;
                const fdinfo = {
                    accountno: src.accountno ?? acc.accountnumber,
                    customername: src.customername ?? src.acctname,
                    currencyid: src.currencyid,
                    statuscd: src.statuscd ?? src.status,
                    interestrate: src.interestrate,
                    dptname: src.dptname,
                    totalyear: src.totalyear,
                    fromdate: src.fromdate ?? src.orgdate,
                    todate: src.todate,
                    balance: src.balance,
                    availablebalance: src.availablebalance,
                    interestpaid: src.interestpaid,
                    accruedinterest: src.accruedinterest,
                    brcd: src.brcd ?? src.brid,
                };
                setDetails(prev => ({ ...prev, [accNo]: { __kind: 'fixed', fdinfo } }));
            } else {
                const normalized: Record<string, any> = {
                    ...raw,
                    accounttype: raw.accounttype ?? raw.accountype ?? acc.accounttype,
                    currentbalance: raw.currentbalance ?? raw.balance,
                    availablebalance: raw.availablebalance ?? raw.available_balance ?? raw.avail_balance,
                };
                setDetails(prev => ({ ...prev, [accNo]: normalized }));
            }
        } catch (e: any) {
            setDetailError(prev => ({ ...prev, [accNo]: e?.message || 'Failed to load account detail' }));
        } finally {
            setDetailLoading(prev => ({ ...prev, [accNo]: false }));
        }
    };

    const toggleRow = async (acc: Contractaccount) => {
        const accNo = acc?.accountnumber || '';
        if (!accNo) return;

        setOpenAccNo(prev => (prev === accNo ? null : accNo));

        if (openAccNo !== accNo && accNo && !details[accNo] && !detailLoading[accNo]) {
            fetchAccountDetail(acc);
        }
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
        setOpenAccNo(null);
    };

    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = parseInt(e.target.value, 5);
        setRowsPerPage(next);
        setPage(0);
        setOpenAccNo(null);
    };

    return (
        <>
            <Global
                styles={{
                    '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                    '@keyframes syncMove': { '0%': { left: '-30%' }, '50%': { left: '100%' }, '100%': { left: '-30%' } },
                }}
            />

            <Card className="shadow-md">
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow className="bg-gray-100">
                                    {accountFields.map(field => (
                                        <TableCell key={field.key}>
                                            <Typography className="font-semibold text-gray-700">{field.label}</Typography>
                                        </TableCell>
                                    ))}
                                    {accounts.some(acc => acc.accounttype?.toUpperCase() !== 'WAL') && (
                                        <TableCell width={120}>
                                            <Typography className="font-semibold text-gray-700 text-right">Actions</Typography>
                                        </TableCell>
                                    )}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {pagedAccounts.length > 0 ? (
                                    pagedAccounts.map((account, idx) => {
                                        const accNo = account.accountnumber || '';
                                        const rowKey = accNo || `row-${page}-${idx}`;
                                        const isOpen = openAccNo === accNo;
                                        const isLoading = !!detailLoading[accNo];
                                        const errMsg = detailError[accNo];
                                        const detailSource: Record<string, any> = details[accNo] || account;

                                        return (
                                            <Fragment key={rowKey}>
                                                <TableRow className="hover:bg-gray-50">
                                                    {accountFields.map(field => (
                                                        <TableCell key={field.key}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                {field.key !== 'accounttype' && field.key !== 'bankaccounttype' && (
                                                                    <Typography className="font-medium text-primary mx-2">
                                                                        {field.key === 'isprimary' ? (
                                                                            <PrimaryIcon isPrimary={account[field.key]} />
                                                                        ) : (
                                                                            account[field.key]?.toString() || '-'
                                                                        )}
                                                                    </Typography>
                                                                )}

                                                                {field.key === 'accounttype' && (
                                                                    <AccountTypeIcon type={account[field.key]} dictionary={dictionary} />
                                                                )}

                                                                {field.key === 'bankaccounttype' && (
                                                                    <AccountTypeIcon type={account[field.key]} dictionary={dictionary} />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                    ))}

                                                    {account.accounttype?.toUpperCase() !== 'WAL' && (
                                                        <TableCell align="right">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<VisibilityIcon />}
                                                                endIcon={isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                                onClick={() => toggleRow(account)}
                                                            >
                                                                {dictionary['common'].view}
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>

                                                {/* Sub-row collapse */}
                                                <TableRow>
                                                    <TableCell 
                                                        style={{ paddingBottom: 0, paddingTop: 0 }} 
                                                        colSpan={accountFields.length + (accounts.some(acc => acc.accounttype?.toUpperCase() !== 'WAL') ? 1 : 0)}
                                                    >
                                                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                                            <Box sx={{ p: 2 }}>
                                                                <Box
                                                                    sx={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 1,
                                                                        px: 1.25,
                                                                        py: 0.75,
                                                                        mb: 1.5,
                                                                        borderRadius: 999,
                                                                        bgcolor: 'primary.50',
                                                                        border: '1px solid',
                                                                        borderColor: 'primary.200',
                                                                    }}
                                                                >
                                                                    <ReceiptLongIcon sx={{ color: 'primary.main' }} fontSize="small" />
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                        {dictionary['account'].accountdetails}
                                                                    </Typography>
                                                                </Box>
                                                                <Divider sx={{ mb: 1.5 }} />

                                                                {isLoading && (
                                                                    <Box
                                                                        sx={{
                                                                            py: 5,
                                                                            width: '100%',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            gap: 2,
                                                                        }}
                                                                    >
                                                                        <CircularProgress size={20} />
                                                                        <Typography>{dictionary['common'].loading}</Typography>
                                                                    </Box>
                                                                )}

                                                                {!isLoading && errMsg && (
                                                                    <Box sx={{ my: 2 }}>
                                                                        <Alert
                                                                            severity="error"
                                                                            action={
                                                                                <Button size="small" onClick={() => fetchAccountDetail(account)}>
                                                                                    {dictionary['common'].retry}
                                                                                </Button>
                                                                            }
                                                                        >
                                                                            {errMsg}
                                                                        </Alert>
                                                                    </Box>
                                                                )}

                                                                {!isLoading && !errMsg && (
                                                                    (detailSource as any).__kind === 'loan' ? (
                                                                        <LoanAccountDetail loan={detailSource.loaninfo} dictionary={dictionary} />
                                                                    ) : (detailSource as any).__kind === 'fixed' ? (
                                                                        <FixedDepositAccountDetail fd={(detailSource as any).fdinfo} dictionary={dictionary} />
                                                                    ) : (
                                                                        <DepositAccountDetail detailSource={detailSource} dictionary={dictionary} />
                                                                    )
                                                                )}
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell 
                                            colSpan={accountFields.length + (accounts.some(acc => acc.accounttype?.toUpperCase() !== 'WAL') ? 1 : 0)} 
                                            className="text-center"
                                        >
                                            <Typography className="text-gray-500">{dictionary['account'].nobankaccount}</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination control */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <TablePagination
                                component="div"
                                count={accounts.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 20, 50, 100]}
                            />
                        </Box>
                    </TableContainer>

                    {accounts.some(acc => acc.accounttype?.toUpperCase() !== 'WAL') && (
                        <Box display="flex" justifyContent="flex-end" mt={5}>
                            <Button variant="contained" color="primary" startIcon={<SyncIcon />} onClick={() => handleSync()}>
                                {dictionary['account'].synchronizecorebanking}
                            </Button>
                        </Box>
                    )}

                    {loading && <SyncOverlay open={loading} />}
                </CardContent>
            </Card>
        </>
    );
};

export default BankAccountInfo;
