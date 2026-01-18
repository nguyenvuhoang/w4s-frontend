'use client'

import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { systemServiceApi, workflowService } from '@/servers/system-service'
import { ConnectionCoreInfo, CoreConfigData } from '@/types/bankType'
import { formatDateTime } from '@/utils/formatDateTime'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'
import { Global } from '@emotion/react'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ComputerIcon from '@mui/icons-material/Computer'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    Typography
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import { Session } from 'next-auth'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

type Props = {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    configdata: CoreConfigData
}

type Optimal9FormValues = {
    ipMemcached: string
    portMemcached: number
    o9UserName: string
    o9Password: string
    o9Encrypt: boolean
    core_mode: string
}

const CoreSetting = ({ session, dictionary, configdata }: Props) => {
    const [showPassword, setShowPassword] = useState(false)
    const [connectionInfo, setConnectionInfo] = useState<ConnectionCoreInfo | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    const connectionJson = configdata?.connection_config_json
        ? JSON.parse(configdata.connection_config_json)
        : {}

    const defaultValues: Optimal9FormValues = {
        ipMemcached: connectionJson.Memcached?.split(':')[0] || '',
        portMemcached: parseInt(connectionJson.Memcached?.split(':')[1]) || 11211,
        o9UserName: connectionJson.O9UserName || '',
        o9Password: connectionJson.O9Password || '',
        o9Encrypt: connectionJson.O9Encrypt ?? false,
        core_mode: connectionJson.core_mode || 'O9'
    }
    const { control, handleSubmit, watch } = useForm<Optimal9FormValues>({
        defaultValues
    })


    const [loading, setLoading] = useState(false)

    const onSubmit = async (data: Optimal9FormValues) => {
        setLoading(true);

        try {
            const connectionConfig = {
                Configure: {
                    CoreIP: 'localhost',
                    CoreName: 'OracleLinux',
                    WKDTimes: 30
                },
                CoreMode: data.core_mode || 'O9',
                DisplayFullErrorStack: false,
                LbName: 'CoreAPINode1',
                Memcached: `${data.ipMemcached}:${data.portMemcached}`,
                MiniProfilerEnabled: false,
                O9Encrypt: data.o9Encrypt,
                O9Password: data.o9Password,
                O9UserName: data.o9UserName,
                PoolConnection: 60
            };

            const savePayload = {
                activecorecode: configdata.active_core_code || 'O9',
                cachettlseconds: 300,
                cachetype: configdata.cache_type || 'MEMCACHED',
                connectionconfigjson: JSON.stringify(connectionConfig),
                connectiontype: configdata.connection_type || 'API',
                extrametadatajson: JSON.stringify({ region: 'VN' }),
                fallbackcorecode: configdata.fallback_core_code || 'O9',
                isfallbackenabled: true,
                mode: data.core_mode || 'O9',
                retrypolicyjson: JSON.stringify({ retries: 3, delay: 2000 }),
                switchedreason: configdata.switched_reason || 'Chuyển sang DEV để bắt đầu test tích hợp',
                timeoutseconds: 30,
                usecache: true,
                coresystemname: configdata.core_system_name || 'Optimal9 Core Banking System'
            };

            const saveConfigResponse = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token || '',
                workflowid: WORKFLOWCODE.BO_SAVE_CONFIG_CONNECTION_CORE,
                input: savePayload
            });

            if (
                !isValidResponse(saveConfigResponse) ||
                (saveConfigResponse.payload.dataresponse.errors && saveConfigResponse.payload.dataresponse.errors.length > 0)
            ) {
                const { execute_id, info } = saveConfigResponse.payload.dataresponse.errors[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                return;
            }

            SwalAlert('success', `${dictionary['common'].datachange.replace("{0}", configdata.active_core_code)}`, 'center');
        } catch (err: any) {
            console.error('❌ Save failed:', err);
            SwalAlert('error', `${dictionary['common'].savefailed}`, 'center');
        } finally {
            setLoading(false);
        }
    };



    const handleTestConnection = async () => {
        setLoading(true)

        const values = watch()
        try {
            const payload = {
                configure: {
                    CoreIP: 'localhost',
                    CoreName: 'OracleLinux',
                    WKDTimes: 30
                },
                core_mode: values.core_mode,
                lbname: connectionJson.lb_name || 'CoreAPINode1',
                memcached: `${values.ipMemcached}:${values.portMemcached}`,
                o9encrypt: values.o9Encrypt,
                o9password: values.o9Password,
                o9username: values.o9UserName,
                poolconnection: connectionJson.pool_connection || 60
            };
            // TODO: Call API to test connection
            const testResponse = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token || '',
                workflowid: WORKFLOWCODE.BO_HEALTH_CHECK_CORE_BANKING,
                input: payload
            });
            if (
                !isValidResponse(testResponse) ||
                (testResponse.payload.dataresponse.errors && testResponse.payload.dataresponse.errors.length > 0)
            ) {
                const { execute_id, info } = testResponse.payload.dataresponse.errors[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                return;
            }
            setConnectionInfo(testResponse.payload.dataresponse.data.input.info as ConnectionCoreInfo);
            setOpenDialog(true);
        } catch (err) {
            console.error('Failed to update mail config', err);
            SwalAlert('error', 'Unexpected error occurred.', 'center');
        } finally {
            setLoading(false);
        }

        setTimeout(() => setLoading(false), 2000) // mock delay
    }

    let retries = ''
    let delay = ''

    try {
        const retryParsed = JSON.parse(configdata.retry_policy_json)
        retries = retryParsed.retries?.toString() ?? ''
        delay = retryParsed.delay?.toString() ?? ''
    } catch {
        retries = ''
        delay = ''
    }

    const coreConfigFields = [
        { label: 'Core Code', value: configdata.active_core_code },
        { label: 'Mode', value: configdata.mode },
        { label: 'Connection Type', value: configdata.connection_type },
        { label: 'Timeout (seconds)', value: configdata.timeout_seconds },
        {
            label: 'Retry Policy',
            value: configdata.retry_policy_json,
            isRetryPolicy: true
        },
        { label: 'Use Cache', value: configdata.use_cache ? 'Yes' : 'No' },
        { label: 'Cache Type', value: configdata.cache_type },
        { label: 'Cache TTL (seconds)', value: configdata.cache_ttl_seconds },
        { label: 'Fallback Core Code', value: configdata.fallback_core_code },
        { label: 'Is Fallback Enabled', value: configdata.is_fallback_enabled ? 'Yes' : 'No' },
        { label: 'Last Updated', value: formatDateTime(configdata.last_updated) },
        { label: 'Updated By', value: configdata.updated_by }
    ]

    return (
        <>
            <Global
                styles={{
                    '@keyframes syncMove': {
                        '0%': { left: '-30%' },
                        '50%': { left: '100%' },
                        '100%': { left: '-30%' }
                    }
                }}
            />

            <Box className="space-y-10 p-6">
                <Typography variant="h5" className="font-semibold text-primary mb-4">
                    {dictionary['setting'].coresetting || 'Core Banking Connection Settings'}
                </Typography>

                <Box className="rounded-2xl border border-gray-200 shadow-md p-6 space-y-4">
                    <Typography variant="h5" className="text-secondary font-medium mb-2">
                        {configdata.core_system_name || 'Core System Information'}
                    </Typography>

                    <Grid container spacing={4}>
                        {coreConfigFields.map((item, index) => (
                            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                                {item.isRetryPolicy ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <TextField
                                            label="Retries"
                                            value={retries}
                                            slotProps={{ input: { readOnly: true } }}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Delay (ms)"
                                            value={delay}
                                            slotProps={{ input: { readOnly: true } }}
                                            fullWidth
                                        />
                                    </Box>
                                ) : (
                                    <TextField
                                        label={item.label}
                                        value={item.value}
                                        slotProps={{ input: { readOnly: true } }}
                                        multiline={false}
                                        fullWidth
                                    />
                                )}
                            </Grid>
                        ))}
                    </Grid>



                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="ipMemcached"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="IP Memcached" variant="outlined" />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="portMemcached"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="Port Memcached" type="number" variant="outlined" />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="o9UserName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="O9 Username" variant="outlined" />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="o9Password"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            type={showPassword ? 'text' : 'password'}
                                            label="O9 Password"
                                            variant="outlined"
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                edge="end"
                                                                size="small"
                                                            >
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                        </Grid>

                        <Box className="flex justify-end gap-4 pt-4">
                            <Button variant="outlined" color="primary" onClick={handleTestConnection}>
                                {dictionary['setting'].testconnection || 'Test Connection'}
                            </Button>
                            <Button variant="contained" color="primary" type="submit">
                                {dictionary['setting'].saveconfiguration || 'Save Configuration'}
                            </Button>
                        </Box>

                        {loading && (
                            <Box
                                sx={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    zIndex: 1300,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Box sx={{ width: 80, height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <ComputerIcon sx={{ fontSize: 48 }} />
                                    </Box>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: 200,
                                            height: 6,
                                            backgroundColor: '#bbb',
                                            borderRadius: 3,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: '-30%',
                                                width: '30%',
                                                height: '100%',
                                                backgroundColor: '#4caf50',
                                                animation: 'syncMove 1.2s linear infinite'
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ width: 80, height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <AccountBalanceIcon sx={{ fontSize: 48 }} />
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </form>
                </Box>

                <Dialog
                    open={openDialog}
                    maxWidth="md"
                    fullWidth
                    disableEscapeKeyDown
                    hideBackdrop={false}
                    onClose={(event, reason) => {
                        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                            setOpenDialog(false);
                        }
                    }}
                >
                    <DialogTitle
                        sx={{ bgcolor: 'primary.main', color: 'white' }}
                    >
                        {dictionary['setting'].connectioninfo || 'Connection Information'}
                    </DialogTitle>

                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            {[
                                { label: `${dictionary['common'].username}`, value: connectionInfo?.usrname },
                                { label: `${dictionary['common'].branchcode}`, value: connectionInfo?.branchcd },
                                { label: `${dictionary['common'].branchname}`, value: connectionInfo?.brname },
                                { label: `${dictionary['common'].businessdate}`, value: connectionInfo?.busdate },
                                { label: `${dictionary['common'].departmentcode}`, value: connectionInfo?.deprtcd },
                                { label: `${dictionary['common'].language}`, value: connectionInfo?.lang },
                                { label: `${dictionary['common'].loginname}`, value: connectionInfo?.lgname },
                                {
                                    label: `${dictionary['common'].isonline}`,
                                    value: (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    backgroundColor:
                                                        connectionInfo?.isonline === 'Y' ? 'green' : 'red'
                                                }}
                                            />
                                            <Typography>
                                                {connectionInfo?.isonline === 'Y' ? 'Online' : 'Offline'}
                                            </Typography>
                                        </Box>
                                    )
                                },
                                { label: `${dictionary['common'].session}`, value: connectionInfo?.uuid },
                            ].map((item, idx) => (
                                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Typography fontWeight="bold">{item.label}</Typography>
                                    {typeof item.value === 'string' || typeof item.value === 'number' ? (
                                        <Typography>{item.value}</Typography>
                                    ) : (
                                        <Box>{item.value}</Box>
                                    )}
                                </Grid>

                            ))}
                        </Grid>
                    </DialogContent>

                    <DialogActions>
                        <Button sx={{ mt: 5 }} variant="contained" onClick={() => setOpenDialog(false)}>
                            {dictionary['common'].close || 'Close'}
                        </Button>
                    </DialogActions>
                </Dialog>


            </Box>
        </>
    )
}

export default CoreSetting
