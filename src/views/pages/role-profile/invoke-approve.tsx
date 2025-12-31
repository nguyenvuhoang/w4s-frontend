import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';
import { MenuItem, Operation, OperationHeader } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { getLocalizedName } from '@/utils/getLocalizedName';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Session } from 'next-auth';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type Props = {
    locale: Locale;
    session: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    tabvalue: number;
};

// Định nghĩa type cho command trong groupedOperations
interface Command {
    command_id: string;
    command_type: string;
    invoke: number;
    approve: number;
    command_name: string;
}

interface GroupedOperation {
    [roleName: string]: {
        role_name: string;
        commands: {
            [commandId: string]: Command;
        };
    };
}

const InvokeApprove = ({ locale, session, dictionary, tabvalue }: Props) => {
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
    const [operations, setOperations] = useState<Operation | undefined>(undefined);
    const [menuData, setMenuData] = useState<MenuItem[]>([]);
    const [menuParent, setMenuParent] = useState<MenuItem[]>([]);
    const [checkboxState, setCheckboxState] = useState<{ [roleName: string]: { [cmdid: string]: boolean } }>({});
    const [selfInvokeState, setSelfInvokeState] = useState<{ [roleName: string]: boolean }>({});
    const [toastOpen, setToastOpen] = useState<boolean>(false); // State để kiểm soát Toast
    const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success'); // Loại thông báo
    const [toastMessage, setToastMessage] = useState<string>(''); // Nội dung thông báo

    const toggleMenu = (menu: string): void => {
        setExpandedMenu(expandedMenu === menu ? null : menu);
    };

    const handleMenuClick = async (menu: MenuItem): Promise<void> => {
        setSelectedMenu(menu);
        try {
            const response = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.WF_BO_LOAD_OPERATION,
                input: {
                    command_id: menu.command_id,
                }
            });
            if (response.status === 200 && response.payload?.dataresponse?.data) {
                const data = response.payload.dataresponse.data as unknown as Operation;
                const operationsData: Operation = data || { operation_header: [], operation_body: [] };
                setOperations(operationsData);

                // Khởi tạo trạng thái checkbox dựa trên dữ liệu ban đầu
                const initialCheckboxState: { [roleName: string]: { [cmdid: string]: boolean } } = {};
                const initialSelfInvokeState: { [roleName: string]: boolean } = {};
                operationsData.operation_body?.forEach(row => {
                    if (!initialCheckboxState[row.role_name]) {
                        initialCheckboxState[row.role_name] = {};
                    }
                    if (row.command_type === 'C') {
                        initialCheckboxState[row.role_name][row.command_id] = row.invoke === 1;
                    }
                    if (row.command_type === 'M') {
                        initialSelfInvokeState[row.role_name] = row.invoke === 1;
                    }
                });
                setCheckboxState(initialCheckboxState);
                setSelfInvokeState(initialSelfInvokeState);
            } else {
                console.warn("⚠️ No operations found for this menu!", response);
                setOperations({ operation_header: [], operation_body: [] });
                setCheckboxState({});
                setSelfInvokeState({});
            }
        } catch (error) {
            console.error("❌ Error fetching operations:", error);
            setOperations({ operation_header: [], operation_body: [] });
            setCheckboxState({});
            setSelfInvokeState({});
        }
    };

    const fetchMenuData = async (channelId: string): Promise<MenuItem[]> => {
        try {
            const response = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.WF_BO_LOAD_MENU,
                input: {
                    channel_id: channelId
                }
            });
            if (response.status === 200 && response.payload?.dataresponse?.data) {
                const menuItem = response.payload.dataresponse.data.data  as MenuItem[];
                return menuItem ;
            }
        } catch (error) {
            console.error("Error fetching menu data:", error);
        }
        return [];
    };

    useEffect(() => {
        const loadMenuData = async () => {
            const channelId = "BO";
            const data = await fetchMenuData(channelId);
            setMenuParent(data?.filter((item: MenuItem) => item.parent_id === "0" && item.group_menu_visible === "1" && item.group_menu_id === null));
            setMenuData(data);
        };
        loadMenuData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabvalue]);

    const groupedOperations: GroupedOperation | undefined = operations?.operation_body?.reduce((acc: GroupedOperation, row) => {
        if (!acc[row.role_name]) {
            acc[row.role_name] = {
                role_name: row.role_name,
                commands: {}
            };
        }
        acc[row.role_name].commands[row.command_id] = {
            command_id: row.command_id,
            command_type: row.command_type,
            invoke: row.invoke,
            approve: row.approve,
            command_name: row.command_name
        };
        return acc;
    }, {});

    interface DynamicColumn {
        cmdid: string;
        caption: string;
    }

    const dynamicColumns: DynamicColumn[] = operations?.operation_header?.map((header: OperationHeader) => ({
        cmdid: header.cmdid,
        caption: header.caption,
    })) || [];

    const getSelfInvokeState = (roleName: string): boolean => {
        const role = groupedOperations?.[roleName];
        if (!role) return false;
        return Object.values(role.commands).some(cmd => cmd.command_type === 'M' && cmd.invoke === 1);
    };

    const getCommandState = (roleName: string, cmdid: string): boolean | null => {
        const role = groupedOperations?.[roleName];
        if (!role) return null;
        const command = role.commands[cmdid];
        if (command && command.command_type === 'C') {
            return command.invoke === 1;
        }
        return null;
    };

    const handleSelfInvokeChange = async (roleName: string, checked: boolean) => {
        setSelfInvokeState(prevState => ({
            ...prevState,
            [roleName]: checked
        }));

        try {
            const roleData = operations?.operation_body?.find(row => row.role_name === roleName);
            if (!roleData) {
                console.error(`Role ${roleName} not found in operation_body`);
                return;
            }

            const command = operations?.operation_body?.find(row => row.role_name === roleName && row.command_type === 'M');
            if (!command) {
                console.error(`No Self Invoke command found for role ${roleName}`);
                return;
            }

            const response = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.BO_UPDATE_RIGHT,
                input: {
                    list_user_right: [
                        {
                            RoleId: roleData.role_id,
                            CommandId: command.command_id,
                            CommandIdDetail: command.command_id_detail || "A",
                            Invoke: checked,
                            Approve: checked,
                            ChannelId: command.application_code,
                        }
                    ]
                }
            });

            if (response.status === 200) {
                const hasError = response.payload.dataresponse.errors.length > 0;
                if (hasError) {
                    setToastSeverity('error');
                    setToastMessage(response.payload.error?.[0]?.info || dictionary['common'].updateerror);
                } else {
                    setToastSeverity('success');
                    setToastMessage(dictionary['common'].updaterolesuccess);
                }
                setToastOpen(true);
            } else {
                console.error(`Failed to update Self Invoke for ${roleName}:`, response);
            }
        } catch (error) {
            console.error(`Error updating Self Invoke for ${roleName}:`, error);
        }
    };

    const handleCommandChange = async (roleName: string, cmdid: string, checked: boolean) => {
        setCheckboxState(prevState => ({
            ...prevState,
            [roleName]: {
                ...prevState[roleName],
                [cmdid]: checked
            }
        }));

        try {
            const roleData = operations?.operation_body?.find(row => row.role_name === roleName && row.command_id === cmdid);
            if (!roleData) {
                console.error(`Role ${roleName} or command ${cmdid} not found in operation_body`);
                return;
            }

            const response = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.BO_UPDATE_RIGHT,
                input: {
                    list_user_right: [
                        {
                            RoleId: roleData.role_id,
                            CommandId: cmdid,
                            CommandIdDetail: roleData.command_id_detail || "A",
                            Invoke: checked,
                            Approve: checked,
                            ChannelId: roleData.application_code,
                        }
                    ],
                }
            });


            if (response.status === 200) {
                const hasError = response.payload.error?.length > 0;
                if (hasError) {
                    setToastSeverity('error');
                    setToastMessage(response.payload.error?.[0]?.info || response.payload.error?.[0]?.info || dictionary['common'].updateerror);
                } else {
                    setToastSeverity('success');
                    setToastMessage(dictionary['common'].updaterolesuccess);
                }
                setToastOpen(true); // Hiển thị Toast
            } else {
                console.error(`Failed to update ${cmdid} for ${roleName}:`, response);
            }
        } catch (error) {
            console.error(`Error updating ${cmdid} for ${roleName}:`, error);
        }
    };

    const handleCloseToast = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setToastOpen(false);
    };

    return (
        <Box>
            <Grid container size={12} spacing={2} marginTop={2} sx={{ flexGrow: 1 }}>
                <Grid size={3}>
                    <Box
                        sx={{
                            border: "1px solid #225087",
                            borderRadius: 2,
                            mb: 5,
                            boxShadow: 1,
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "#225087",
                                color: "white",
                                px: 3,
                                py: 1.5,
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: "bold",
                                    color: "white",
                                    '&.MuiTypography-root': { display: 'block', textAlign: 'left' },
                                }}
                            >
                                {dictionary.common.menu}
                            </Typography>
                        </Box>
                        <Box>
                            {menuParent?.map(parent => {
                                const children = menuData.filter(
                                    (item: MenuItem) =>
                                        item.parent_id === parent.command_id && item.group_menu_visible === "1"
                                );

                                // Có children -> Accordion như cũ
                                if (children.length > 0) {
                                    return (
                                        <Accordion
                                            key={parent.command_id}
                                            expanded={expandedMenu === parent.command_id}
                                            onChange={() => toggleMenu(parent.command_id)}
                                            sx={{ bgcolor: 'white' }}
                                        >
                                            <AccordionSummary sx={{ pl: 5, color: '#225087' }} expandIcon={<ExpandMoreIcon />}>
                                                <ListItemIcon>
                                                    {/* Parent có children dùng RootIcon */}
                                                    <AccountTreeIcon sx={{ color: '#225087' }} />
                                                </ListItemIcon>
                                                <Typography fontWeight="bold" sx={{ color: '#225087', mx: 2 }}>
                                                    {getLocalizedName(parent.command_name_language, locale)}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pl: 5, color: '#225087' }}>
                                                <List>
                                                    {children.map(child => (
                                                        <ListItem
                                                            key={child.command_id}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                color: selectedMenu?.command_id === child.command_id ? '#0a9150' : 'inherit',
                                                            }}
                                                            onClick={() => handleMenuClick(child)}
                                                        >
                                                            <ListItemIcon>
                                                                <FolderIcon
                                                                    color={selectedMenu?.command_id === child.command_id ? 'primary' : 'warning'}
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={getLocalizedName(child.command_name_language, locale)}
                                                                slotProps={{
                                                                    primary: {
                                                                        style: {
                                                                            color: '#225087',
                                                                            fontWeight: selectedMenu?.command_id === child.command_id ? 700 : 400
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                }

                                // KHÔNG có children -> render ListItem trực tiếp để tick quyền cho PARENT
                                return (
                                    <List key={parent.command_id} sx={{ pl: 0 }}>
                                        <ListItem
                                            sx={{
                                                cursor: 'pointer',
                                                color: selectedMenu?.command_id === parent.command_id ? '#0a9150' : 'inherit',
                                                pl: 5
                                            }}
                                            onClick={() => handleMenuClick(parent)}
                                        >
                                            <ListItemIcon>
                                                <AccountTreeIcon
                                                    color={selectedMenu?.command_id === parent.command_id ? 'primary' : 'action'}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={getLocalizedName(parent.command_name_language, locale)}
                                                slotProps={{
                                                    primary: {
                                                        style: {
                                                            color: '#0a9150',
                                                            fontWeight: selectedMenu?.command_id === parent.command_id ? 700 : 400
                                                        }
                                                    }
                                                }}
                                            />
                                        </ListItem>
                                    </List>
                                );
                            })}
                        </Box>
                    </Box>
                </Grid>

                <Grid size={9}>
                    <Box
                        sx={{
                            border: "1px solid #225087",
                            borderRadius: 2,
                            mb: 5,
                            boxShadow: 1,
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "#225087",
                                color: "white",
                                px: 3,
                                py: 1.5,
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: "bold",
                                    color: "white",
                                    '&.MuiTypography-root': { display: 'block', textAlign: 'left' },
                                }}
                            >
                                {dictionary['common'].operation} {getLocalizedName(selectedMenu?.command_name_language, locale)}
                            </Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={2}>
                                {operations ? (
                                    <TableContainer component={Paper}
                                        sx={{
                                            maxHeight: 600,
                                            border: '1px solid #ddd',
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
                                                background: '#074d2f',
                                            },
                                            scrollbarWidth: 'thin',
                                            scrollbarColor: '#225087 #f1f1f1',
                                        }}
                                    >
                                        <Table stickyHeader sx={{ borderCollapse: 'collapse' }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold', color: 'white', borderRight: '1px solid #ddd', background: "#225087" }}>{dictionary['common'].rolename}</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center', borderRight: '1px solid #ddd', background: "#225087" }}>{dictionary['common'].selfInvoke}</TableCell>
                                                    {dynamicColumns.map((col: DynamicColumn) => (
                                                        <TableCell key={col.cmdid} sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center', borderRight: '1px solid #ddd', background: "#225087" }}>{col.caption}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {Object.keys(groupedOperations || {}).map((roleName: string, index: number) => {
                                                    const role = groupedOperations![roleName];
                                                    const initialSelfInvoke = getSelfInvokeState(roleName);
                                                    const isSelfInvokeChecked = selfInvokeState[roleName] ?? initialSelfInvoke;
                                                    return (
                                                        <TableRow
                                                            key={index}
                                                            sx={
                                                                {
                                                                    '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff',
                                                                    '&:hover': { backgroundColor: '#f1f1f1' },
                                                                    cursor: 'pointer',
                                                                    '& td': {
                                                                        borderBottom: '1px solid #e0e0e0',
                                                                    },
                                                                }
                                                            }>
                                                            <TableCell sx={{ borderRight: '1px solid #ddd', background: 'white', color: '#225087' }}>{role.role_name}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid #ddd', textAlign: 'center' }}>
                                                                <Checkbox
                                                                    checked={isSelfInvokeChecked}
                                                                    onChange={(e) => handleSelfInvokeChange(roleName, e.target.checked)}
                                                                />
                                                            </TableCell>
                                                            {dynamicColumns.map((col: DynamicColumn) => {
                                                                const hasCommand = getCommandState(roleName, col.cmdid);
                                                                const isChecked = checkboxState[roleName]?.[col.cmdid] ?? (hasCommand === true);
                                                                return (
                                                                    <TableCell key={col.cmdid} sx={{ textAlign: 'center', borderRight: '1px solid #ddd' }}>
                                                                        {hasCommand !== null ? (
                                                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <Checkbox
                                                                                    checked={isChecked}
                                                                                    onChange={(e) => handleCommandChange(roleName, col.cmdid, e.target.checked)}
                                                                                />
                                                                            </Box>
                                                                        ) : (
                                                                            '-'
                                                                        )}
                                                                    </TableCell>

                                                                );
                                                            })}
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Grid size={12} display="flex" justifyContent="center" alignItems="center">
                                        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Image src="/images/illustrations/empty-list.svg" width={160} height={160} alt="No Transactions" style={{ marginBottom: '20px' }} priority />
                                            <Typography variant="body1" color="#0a9150">
                                                {dictionary.common.nooperation}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
            <SnackbarComponent handleCloseToast={handleCloseToast} toastMessage={toastMessage} toastOpen={toastOpen} toastSeverity={toastSeverity} />
        </Box>
    );
};

export default InvokeApprove;