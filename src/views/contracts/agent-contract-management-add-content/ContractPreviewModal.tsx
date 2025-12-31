'use client';

import { ACCOUNT_STATUS_LABELS, ACCOUNT_TYPE_LABELS, selectOptionsGender, selectOptionsPurpose, siteConfig } from '@/data/meta';
import { PageContentProps } from '@/types';
import { getDictionary } from '@/utils/getDictionary';
import { renderFormattedDate } from '@/utils/renderFormattedDate';
import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import Image from 'next/image';

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: any;
} & PageContentProps;


const ContractPreviewModal = ({ open, onClose, onConfirm, data, dictionary, locale }: Props) => {
    if (!data) return null;

    const paymentAccounts = data.account?.filter(
        (acc: { accounttype: string; bankaccounttype: string; }) => acc.accounttype === 'S' || acc.bankaccounttype === 'DD'
    ) || [];

    const loanAccounts = data.account?.filter(
        (acc: { accounttype: string; bankaccounttype: string; }) => acc.accounttype === 'L' || acc.bankaccounttype === 'LN'
    ) || [];

    const renderAccountTable = (title: string, accounts: any[], dictionary: Awaited<ReturnType<typeof getDictionary>>) => {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography fontWeight="bold" sx={{ backgroundColor: '#09633F', color: '#fff', px: 2, py: 1, borderRadius: 1 }}>
                    {title}
                </Typography>

                <Box sx={{ mt: 5, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>

                    <Table size="small" sx={{ fontSize: 13 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ border: '1px solid #ccc', fontWeight: 'bold' }}>#</TableCell>
                                <TableCell sx={{ border: '1px solid #ccc', fontWeight: 'bold' }}>{dictionary["account"].accountnumber}</TableCell>
                                <TableCell sx={{ border: '1px solid #ccc', fontWeight: 'bold' }}>{dictionary["transfer"].currency}</TableCell>
                                <TableCell sx={{ border: '1px solid #ccc', fontWeight: 'bold' }}>{dictionary["contract"].accounttype}</TableCell>
                                <TableCell sx={{ border: '1px solid #ccc', fontWeight: 'bold' }}>{dictionary["account"].accountstatus}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {accounts.map((acc, idx) => {
                                return (
                                    <TableRow key={idx}>
                                        <TableCell sx={{ border: '1px solid #ccc' }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ccc' }}>{acc.accountnumber}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ccc' }}>{acc.currency}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ccc' }}>{ACCOUNT_TYPE_LABELS[acc.accounttype]}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ccc' }}>{ACCOUNT_STATUS_LABELS[acc.status]}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </Box>
            </Box>
        );
    };


    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                    onClose();
                }
            }}
            maxWidth="md"
            fullWidth>
            <DialogTitle sx={{
                textAlign: 'center',
                backgroundColor: '#09633F',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 16,
                py: 2
            }}

            >
                {dictionary['contract'].confirmtitle}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: '#fff',
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ fontSize: 13, lineHeight: 1.5 }}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Image src="/images/logobank/emi.svg" alt="EMI Logo" width={60} height={60} />
                        <Typography variant="h5" fontWeight="bold" mt={1}>
                            {dictionary['contract'].confirmtitle}
                        </Typography>
                        <Typography>
                            {dictionary['contract'].contractnumber}:{' '}
                            <Typography
                                component="span"
                                variant="subtitle1"
                                sx={{ textDecoration: 'underline', ml: 1, fontWeight: 'bold', color: '#09633F' }}
                            >
                                {data.contractNumber}
                            </Typography>
                        </Typography>

                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        {/* Left: Contract Type */}
                        <Box display="flex" alignItems="center">
                            <Box component="span" fontWeight="bold" mr={2}>
                                {dictionary['contract'].contracttype}:
                            </Box>
                            <FormControlLabel
                                control={<Checkbox checked={data.contracttype === 'INDIVIDUAL'} disabled />}
                                label={dictionary['contract'].individual}
                            />
                            <FormControlLabel
                                control={<Checkbox checked={data.contracttype === 'BUSSINESS'} disabled />}
                                label={dictionary['contract'].business}
                            />
                        </Box>

                        {/* Right: Contract Purpose */}
                        <Box display="flex" alignItems="center">
                            <Box component="span" fontWeight="bold" mr={1}>
                                {dictionary['contract'].contractpurpose}:
                            </Box>
                            <Typography component="span">
                                {
                                    selectOptionsPurpose?.find(opt => opt.value === data.contractpurpose)?.label || '--'
                                }
                            </Typography>
                        </Box>
                    </Box>


                    <Box sx={{ mb: 2 }}>
                        <Typography>
                            {dictionary['contract'].contractdatesign}{' '}
                            {renderFormattedDate(data.fromdate, locale)}
                        </Typography>
                    </Box>


                    <Box sx={{ p: 1, background: '#09633F', fontWeight: 'bold', mb: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1 }}>
                        A. {siteConfig.companyname}
                    </Box>

                    <Box sx={{ my: 5 }}>
                        <Typography>{dictionary['contract'].address}: {siteConfig.companyadress}</Typography>
                        <Typography>{dictionary['contract'].phonenumber}: {siteConfig.companyadress}  </Typography>
                        <Typography>Website: {siteConfig.companywebsite} | {dictionary['navigation'].email}: emi@emimfi.com.vn</Typography>
                    </Box>

                    <Box sx={{ p: 1, background: '#09633F', fontWeight: 'bold', mb: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1 }}>
                        B. {dictionary['contract'].personalregistration}
                    </Box>

                    <Box sx={{ my: 5 }}>
                        <Typography>
                            {dictionary['contract'].cifnumber}:{' '}
                            <Box component="span" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                                {data.cifnumber}
                            </Box>
                        </Typography>
                        <Typography>
                            {dictionary['contract'].fullname}:{' '}
                            <Box component="span" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                                {data.fullname}
                            </Box>
                        </Typography>

                        <Typography>
                            {dictionary['contract'].idcard}:{' '}
                            <Box component="span" fontWeight="bold">{data.idcard}</Box> – {dictionary['contract'].issuedate}:{' '}
                            <Box component="span" fontWeight="bold">{data.issuedate}</Box>
                        </Typography>

                        <Typography>
                            {dictionary['contract'].issueplace}:{' '}
                            <Box component="span" fontWeight="bold">{data.issueplace}</Box>
                        </Typography>

                        <Typography>
                            {dictionary['contract'].birthday}:{' '}
                            <Box component="span" fontWeight="bold">{data.birthday}</Box> – {dictionary['contract'].country}:{' '}
                            <Box component="span" fontWeight="bold">{data.country}</Box> – {dictionary['contract'].gender}:{' '}
                            <Box component="span" fontWeight="bold">
                                {selectOptionsGender?.find(opt => opt.value === data.gender)?.label || '--'}
                            </Box>
                        </Typography>

                        <Typography>
                            {dictionary['contract'].address}:{' '}
                            <Box component="span" fontWeight="bold">{data.residentaddress}</Box>
                        </Typography>

                        <Typography>
                            Email:{' '}
                            <Box component="span" fontWeight="bold">{data.email}</Box> | {dictionary['contract'].phonenumber}:{' '}
                            <Box component="span" fontWeight="bold">{data.phone}</Box>
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 4 }}>
                        <Typography fontWeight="bold" sx={{ mb: 2, color: '#09633F' }}>
                            {dictionary['contract'].registerproducttitle}
                        </Typography>

                        <Typography sx={{ mb: 2 }}>
                            {dictionary['contract'].registerproductdesc}
                        </Typography>

                        {paymentAccounts.length > 0 && renderAccountTable(dictionary['contract'].paymentaccount, paymentAccounts, dictionary)}
                        {loanAccounts.length > 0 && renderAccountTable(dictionary['contract'].loanaccount, loanAccounts, dictionary)}


                        {/* Block 3: Dịch vụ thông báo */}
                        <Box sx={{ background: '#09633F', color: '#fff', p: 1, borderRadius: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography fontWeight="bold" color='white'>{dictionary['contract'].notification}</Typography>
                        </Box>

                        <Box sx={{ ml: 2, mb: 2 }}>
                            <Typography>{data.notificationservice || 'EMI Notification / SmartBank App / SMS'}</Typography>
                        </Box>
                    </Box>


                </Box>
            </DialogContent>

            <DialogActions sx={{ marginTop: 5 }}>
                <Button onClick={onClose} variant='outlined' >{dictionary['common'].cancel}</Button>
                <Button onClick={onConfirm} variant="contained" color="primary">
                    {dictionary['common'].submit}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ContractPreviewModal;
