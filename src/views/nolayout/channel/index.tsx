'use client';

import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { PageContentProps } from '@shared/types';
import { ChannelType } from '@shared/types/bankType';
import { getDictionary } from '@utils/getDictionary';
import { isValidResponse } from '@utils/isValidResponse';
import SwalAlert from '@utils/SwalAlert';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    Typography,
    useTheme,
} from '@mui/material';
import { Session } from 'next-auth';
import * as React from 'react';

type PageProps = PageContentProps & {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    session: Session | null;
    locale: Locale;
    channelData: ChannelType[];
};

function a11yProps(index: number) {
    return {
        id: `channel-tab-${index}`,
        'aria-controls': `channel-tabpanel-${index}`,
    };
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`channel-tabpanel-${index}`}
            aria-labelledby={`channel-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

const ChannelContent = ({ dictionary, channelData, session }: PageProps) => {
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const [channels, setChannels] = React.useState<ChannelType[]>(channelData);
    const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleChannelStatus = (channelid: string, isOpen: boolean) => {
        const actionText = isOpen ? 'open' : 'close';

        SwalAlert(
            'question',
            `Do you want to ${actionText} this channel immediately?`,
            'center',
            true,
            true,
            true,
            async () => {
                try {
                    setActionLoadingId(channelid);

                    const channelApi = await workflowService.runFODynamic({
                        sessiontoken: session?.user?.token as string,
                        workflowid: WORKFLOWCODE.BO_UPDATE_CHANNEL_STATUS,
                        input: {
                            channel_action: channelid, // (giá»¯ nguyÃªn theo API cá»§a báº¡n)
                            isopen: isOpen
                        },
                    });

                    if (
                        !isValidResponse(channelApi) ||
                        (channelApi.payload?.dataresponse?.errors && channelApi.payload.dataresponse.errors.length > 0)
                    ) {
                        const error = channelApi.payload?.dataresponse?.errors?.[0];
                        const errorString = `ExecutionID: ${error?.execute_id ?? ''} - ${error?.info ?? 'Unknown error'}`;
                        SwalAlert('error', errorString, 'center');
                        return;
                    }

                    const newStatus = channelApi.payload?.dataresponse?.data.input.status;

                    setChannels(prev =>
                        prev.map(c =>
                            c.channel_id === channelid ? ({ ...c, status: newStatus } as ChannelType) : c
                        )
                    );

                    SwalAlert('success', `Channel has been ${actionText}ed successfully.`, 'center');
                } catch (err) {
                    console.error(err);
                    SwalAlert('error', 'Action failed. Please try again.', 'center');
                } finally {
                    setActionLoadingId(null);
                }
            },
            isOpen ? 'Open' : 'Close'
        );
    };


    return (
        <Box sx={{ my: 5, width: '100%' }}>
            {/* Tabs header */}
            <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Channel tabs"
                sx={{ borderBottom: `2px solid ${theme.palette.divider}`, mb: 2 }}
            >
                    {channels.map((ch, idx) => (
                        <Tab
                            key={ch.id}
                            label={`${ch.channel_id} â€” ${ch.channel_name}`}
                            {...a11yProps(idx)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                color: theme.palette.text.primary,
                                '&.Mui-selected': { color: theme.palette.primary.main },
                            }}
                        />
                    ))}
                </Tabs>

                {/* Panels */}
                {channels.map((ch, idx) => (
                    <TabPanel key={ch.id} value={value} index={idx}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography variant="h6" fontWeight={600}>
                                        {ch.channel_id} â€” {ch.channel_name}
                                    </Typography>

                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                        <Chip
                                            icon={ch.status ? <CheckCircleIcon /> : <CancelIcon />}
                                            label={ch.status ? 'Active' : 'Inactive'}
                                            color={ch.status ? 'primary' : 'error'}
                                            sx={{
                                                fontWeight: 600,
                                                '& .MuiChip-icon': {
                                                    color: 'inherit', 
                                                },
                                            }}
                                        />


                                        {/* NÃºt hÃ nh Ä‘á»™ng Open / Close */}
                                        <Box display="flex" gap={1} ml={2}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                disabled={!!actionLoadingId || ch.status === true}
                                                onClick={() => handleChannelStatus(ch.channel_id, true)}
                                                startIcon={
                                                    actionLoadingId === ch.channel_id && ch.status === false ? (
                                                        <CircularProgress size={16} />
                                                    ) : undefined
                                                }
                                            >
                                                {dictionary['common']?.open || 'Open'}
                                            </Button>

                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="error"
                                                disabled={!!actionLoadingId || ch.status === false}
                                                onClick={() => handleChannelStatus(ch.channel_id, false)}
                                                startIcon={
                                                    actionLoadingId === ch.channel_id && ch.status === true ? (
                                                        <CircularProgress size={16} />
                                                    ) : undefined
                                                }
                                            >
                                                {dictionary['common']?.close || 'Close'}
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>

                                {ch.description && (
                                    <Typography variant="body2" color="text.primary" mb={2}>
                                        {ch.description}
                                    </Typography>
                                )}

                                <Table
                                    size="small"
                                    sx={{
                                        borderCollapse: 'separate',
                                        borderSpacing: 0,
                                        '& th': {
                                            backgroundColor: theme.palette.primary.main,
                                            color: 'white',
                                            fontWeight: 600,
                                            textAlign: 'left',
                                        },
                                        '& td, & th': {
                                            borderBottom: `1px solid ${theme.palette.divider}`,
                                            padding: '10px 16px',
                                        },
                                        '& tr:last-child td': { borderBottom: 0 },
                                        '& tbody tr:hover': { backgroundColor: theme.palette.action.hover },
                                    }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: '30%' }}>Day</TableCell>
                                            <TableCell>Working Hours</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {ch.weekly.map((d: any, index: number) => (
                                            <TableRow
                                                key={`${index}-${d.day_of_week}`}
                                                sx={{
                                                    ...(d.is_today && {
                                                        backgroundColor: theme.palette.success.light + '20',
                                                        borderLeft: `4px solid ${theme.palette.success.main}`,
                                                        '& td': {
                                                            fontWeight: 600,
                                                            color: theme.palette.success.dark,
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: theme.palette.success.light + '30',
                                                        },
                                                    }),
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 500 }}>
                                                    {d.day_name}
                                                    {d.is_today && (
                                                        <Chip
                                                            label="Today"
                                                            size="small"
                                                            sx={{
                                                                ml: 1,
                                                                height: 22,
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                backgroundColor: theme.palette.success.main,
                                                                color: 'white',
                                                                borderRadius: '6px',
                                                            }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {d.is_closed ? (
                                                        <Chip label="Closed" color="default" sx={{ borderRadius: '8px' }} />
                                                    ) : d.intervals.length === 0 ? (
                                                        <Chip label="No interval" color="warning" sx={{ borderRadius: '8px' }} />
                                                    ) : (
                                                        d.intervals.map(
                                                            (iv: { start: any; end: any }, idx2: React.Key | null | undefined) => (
                                                                <Chip
                                                                    key={idx2}
                                                                    label={`${iv.start} - ${iv.end}`}
                                                                    sx={{
                                                                        mr: 1,
                                                                        mb: 0.5,
                                                                        backgroundColor: theme.palette.grey[100],
                                                                        borderRadius: '8px',
                                                                        fontWeight: 500,
                                                                    }}
                                                                />
                                                            )
                                                        )
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabPanel>
                ))}
            </Box>
    );
};

export default ChannelContent;


