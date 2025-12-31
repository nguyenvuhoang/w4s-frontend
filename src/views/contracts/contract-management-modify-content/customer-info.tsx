'use client'

import { CustomerTypeIcon } from '@/components/layout/shared/CustomerTypeIcon'
import { NationIcon } from '@/components/layout/shared/NationIcon'
import { SexIcon } from '@/components/layout/shared/SexIcon'
import { StatusIcon } from '@/components/layout/shared/StatusIcon'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { systemServiceApi } from '@/servers/system-service'
import { useCustomerInfoHandler } from '@/services/useCustomerInfoHandler'
import { Contract, Customer } from '@/types/bankType'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'
import { toDateInput } from '@/utils/toDateInput'
import { toLowercaseKeys } from '@/utils/toLowercaseObject'
import SyncOverlay from '@/views/components/SyncOverlay'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import StarIcon from '@mui/icons-material/Star'
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    InputAdornment,
    MenuItem,
    TextField,
    Tooltip
} from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'


// Danh sách field + label
const customerFields: { key: keyof Customer; label: string }[] = [
    { key: 'custid', label: 'Customer Code' },
    { key: 'fullname', label: 'Full Name' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'addrresident', label: 'Address' },
    { key: 'sex', label: 'Sex' },
    { key: 'nation', label: 'Nation' },
    { key: 'tel', label: 'Telephone' },
    { key: 'email', label: 'Email' },
    { key: 'licensetypecaption', label: 'License Type' },
    { key: 'licenseid', label: 'License ID' },
    { key: 'issuedate', label: 'Issue Date' },
    { key: 'issueplace', label: 'Issue Place' },
    { key: 'branchid', label: 'Branch ID' },
    { key: 'statuscaption', label: 'Status' },
    { key: 'customertypecaption', label: 'Customer Type' },
    { key: 'cfcode', label: 'Core Banking Customer Code' },
    { key: 'phonecountrycode', label: 'Phone Country Code' },
    { key: 'kycid', label: 'KYC ID' },
    { key: 'usercreated', label: 'User Created' },
    { key: 'datecreated', label: 'Date Created' },
]

// Field dạng date
const dateFields = new Set<keyof Customer>(['dob', 'issuedate', 'datecreated'])

// Field read-only
const readOnlyFields = new Set<keyof Customer>([
    'custid',
    'cfcode',
    'branchid',
    'usercreated',
    'datecreated',
    'kycid',
    'statuscaption',
    'customertypecaption',
    'nation',
    'licenseid',
    'licensetypecaption',
    'issuedate',
    'tel',
    'phonecountrycode'
])

// Icon KYC level
const getKycLevelIcon = (kycid: string | undefined) => {
    const level = parseInt(kycid || '0', 10)
    if (isNaN(level) || level < 1 || level > 5) return null
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {Array.from({ length: level }, (_, index) => (
                <StarIcon key={index} sx={{ color: '#ffca28', fontSize: 20, mr: 0.5 }} />
            ))}
        </Box>
    )
}

type Props = {
    contractdata: Contract
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
}

const CustomerInfo = ({ contractdata, dictionary, session }: Props) => {
    const customer = (contractdata?.customer || [])[0] as Customer | undefined

    // Default values (xử lý date + ép string cho region/township)
    const defaultValues = useMemo(() => {
        const acc: any = {}
        customerFields.forEach(f => {
            const raw = (customer?.[f.key] as any) ?? ''
            const val = dateFields.has(f.key) ? toDateInput(raw) : raw
            acc[f.key] =
                f.key === 'region' || f.key === 'township' ? String(val ?? '') : val
        })
        return acc
    }, [customer])

    const methods = useForm<any>({ defaultValues })
    const { control, handleSubmit, reset, watch } = methods

    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        reset(defaultValues)
    }, [defaultValues, reset])

    // Sync core banking (nếu cần)
    const { loading } = useCustomerInfoHandler({
        customerCode: customer?.cfcode,
        customertype: customer?.cftype,
        session,
        dictionary
    })



    type CustomerFormValues = {
        address?: string;
        customercode?: string;
        dob?: string | Date | null;
        email?: string;
        fullname?: string;
        issueplace?: string;
        sex?: string;
        username?: string;
    };

    const formatDate = (d?: string | Date | null) => {
        if (!d) return null;
        const dt = typeof d === 'string' ? new Date(d) : d;
        if (isNaN(dt.getTime())) return null;
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const mapValues = (v: any) => ({
        Address: v.addrresident ?? customer?.addrresident ?? '',
        CustomerCode: v.custid ?? customer?.custid ?? customer?.cfcode ?? '',
        DOB: formatDate(v.dob ?? customer?.dob) ?? null,
        Email: v.email ?? customer?.email ?? '',
        FullName: v.fullname ?? customer?.fullname ?? '',
        IssuePlace: v.issueplace ?? customer?.issueplace ?? '',
        Sex: (v.sex ?? customer?.sex ?? '').toString().trim().substring(0, 1).toUpperCase(),
        UserName: v.username ?? session?.user?.name ?? customer?.usercreated ?? ''
    });

    const onSubmit = async (values: CustomerFormValues) => {
        const mapped = mapValues(values);

        try {
            setIsLoading(true);
            const lowercased = toLowercaseKeys(mapped);

            const response = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.BO_UPDATE_CUSTOMER,
                input: { ...lowercased }
            });

            if (
                !isValidResponse(response) ||
                (response.payload.dataresponse.error && response.payload.dataresponse.error.length > 0)
            ) {
                const errorString = 'ExecutionID:' + response.payload.dataresponse.error[0].execute_id + ' - ' + response.payload.dataresponse.error[0].info
                SwalAlert('error', errorString, 'center');
                return;
            }

            SwalAlert('success', dictionary['common'].datachange.replace('{0}', 'customer'), 'center', false, false, true);


        } catch (e: any) {
            console.error('FO run exception:', e);
            SwalAlert('error', e?.message || 'Unexpected error', 'center');
        } finally {
            setIsLoading(false);
        }
    };

    const busy = loading || isLoading

    return (
        <Card className="shadow-md">
            <CardContent>
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <Grid
                            container
                            spacing={8}
                            sx={{ '& > .MuiGrid-root': { paddingLeft: 5, paddingRight: 5 } }}
                        >
                            {customerFields.map(field => {
                                const isReadOnly = readOnlyFields.has(field.key)

                                const endAdornment =
                                    field.key === 'sex' ? (
                                        <SexIcon sex={watch('sex')} dictionary={dictionary} />
                                    ) : field.key === 'nation' ? (
                                        <NationIcon nation={watch('nation')} dictionary={dictionary} />
                                    ) : field.key === 'statuscaption' ? (
                                        <StatusIcon status={customer?.status} />
                                    ) : field.key === 'customertypecaption' ? (
                                        <CustomerTypeIcon type={customer?.cftype} />
                                    ) : field.key === 'kycid' ? (
                                        getKycLevelIcon(watch('kycid'))
                                    ) : null

                                const lockAdornment = isReadOnly ? (
                                    <InputAdornment position="start">
                                        <Tooltip title={dictionary['common']?.readonly ?? 'Read-only'}>
                                            <LockOutlinedIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                                        </Tooltip>
                                    </InputAdornment>
                                ) : undefined

                                // SEX select
                                if (field.key === 'sex') {
                                    return (
                                        <Grid key="sex" size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="sex"
                                                control={control}
                                                rules={{ required: `${field.label} is required` }}
                                                render={({ field: rhfField, fieldState }) => (
                                                    <TextField
                                                        {...rhfField}
                                                        select
                                                        fullWidth
                                                        size="small"
                                                        label={field.label}
                                                        slotProps={{
                                                            inputLabel: { shrink: true },
                                                            input: { startAdornment: lockAdornment },
                                                            select: {
                                                                renderValue: (value: any) => (
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'flex-end',
                                                                            gap: 1
                                                                        }}
                                                                    >
                                                                        <SexIcon sex={value} dictionary={dictionary} />
                                                                    </Box>
                                                                )
                                                            }
                                                        }}
                                                        sx={{
                                                            '& .MuiSelect-select': {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'flex-end',
                                                                gap: 1,
                                                                paddingRight: '56px !important'
                                                            },
                                                            '& .MuiSelect-icon': { right: 8 }
                                                        }}
                                                        disabled={isReadOnly}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    >
                                                        <MenuItem value="M">{dictionary['common']?.male ?? 'Male'}</MenuItem>
                                                        <MenuItem value="F">{dictionary['common']?.female ?? 'Female'}</MenuItem>
                                                    </TextField>
                                                )}
                                            />
                                        </Grid>
                                    )
                                }

                                // DEFAULT fields
                                return (
                                    <Grid size={{ xs: 12, md: 6 }} key={field.key as string}>
                                        <Controller
                                            name={field.key as any}
                                            control={control}
                                            rules={
                                                field.key === 'fullname'
                                                    ? { required: `${field.label} is required` }
                                                    : undefined
                                            }
                                            render={({ field: rhfField, fieldState }) => (
                                                <TextField
                                                    {...rhfField}
                                                    fullWidth
                                                    size="small"
                                                    label={field.label}
                                                    type={dateFields.has(field.key) ? 'date' : 'text'}
                                                    slotProps={{
                                                        inputLabel: { shrink: true },
                                                        htmlInput: { style: { textAlign: 'right' } },
                                                        input: {
                                                            startAdornment: lockAdornment,
                                                            endAdornment: endAdornment ? (
                                                                <InputAdornment position="end">{endAdornment}</InputAdornment>
                                                            ) : undefined
                                                        }
                                                    }}
                                                    disabled={isReadOnly}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                )
                            })}
                        </Grid>

                        {/* Actions */}
                        <Box display="flex" justifyContent="space-between" m={5} gap={2}>
                            <Box display="flex" gap={2}>
                                <Button type="submit" variant="contained">
                                    {dictionary['common']?.save ?? 'Save'}
                                </Button>
                                <Button type="button" variant="outlined" onClick={() => reset(defaultValues)}>
                                    {dictionary['common']?.reset ?? 'Reset'}
                                </Button>
                            </Box>
                        </Box>
                    </form>
                </FormProvider>

                {busy && <SyncOverlay open={busy} />}
            </CardContent>
        </Card>
    )
}

export default CustomerInfo
