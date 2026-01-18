/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { workflowService } from '@/servers/system-service';
import { FormInput, MenuItem, OperationBody } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Session } from 'next-auth';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type Props = {
    input: FormInput;
    session: Session | null;
    renderviewdata?: any;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
};

const RenderPermissionPanel = ({ input, session, renderviewdata, dictionary }: Props) => {
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const [menuData, setMenuData] = useState<any[]>([]);
    const [menuParent, setMenuParent] = useState<any[]>([]);
    const [hasFetched, setHasFetched] = useState<boolean>(false);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
    const [operations, setOperations] = useState<OperationBody[] | undefined>(undefined);

    const toggleMenu = (menu: string) => {
        setExpandedMenu(expandedMenu === menu ? null : menu);
    };

    const serviceid = renderviewdata?.[input.config?.keyloadmenu];

    let txFo_: any = { load_menu: {}, load_operation: {} };
    let loadmenu = {} as any;
    let loadoperation = {} as any;
    try {
        txFo_ = JSON.parse(input.config.txFo);
        loadmenu = txFo_.load_menu;
        loadoperation = txFo_.load_operation;
    } catch (error) {
        console.error("Error parsing txFo:", error);
    }

    if (serviceid && loadmenu) {
        Object.keys(loadmenu).forEach(key => {
            loadmenu[key].forEach((item: any) => {
                if (item.input?.[input.config.key_selected]) {
                    item.input[input.config.key_selected] = serviceid;
                }
            });
        });
    }

    const fetchMenuData = async () => {
        try {
            const response = await workflowService.runBODynamic({
                sessiontoken: session?.user?.token as string,
                txFo: loadmenu,
            });

            if (response.status === 200 && response.payload?.dataresponse) {
                return response.payload.dataresponse.data.input.data;
            }
        } catch (error) {
            console.error("Error fetching menu data:", error);
        }
        return [];
    };

    useEffect(() => {
        if (loadmenu && !hasFetched) {
            const loadMenuData = async () => {
                const data = await fetchMenuData();
                setMenuData(data);
                setMenuParent(data.filter((item: any) => item.parent_id === "0"));
                setHasFetched(true);
            };
            loadMenuData();
        }
    }, [loadmenu]);

    const handleMenuClick = async (menu: MenuItem) => {
        setSelectedMenu(menu)
        if (!loadoperation) {
            console.warn("⚠️ No operation config found!");
            return;
        }

        Object.keys(loadoperation).forEach((key) => {
            loadoperation[key].forEach((item: any) => {

                if (!item.input) {
                    item.input = {};
                }
                if (!item.input.channel_id) {
                    item.input.channel_id = "PORTAL";
                }


                if (input.config.keyloadoperation && item.input.hasOwnProperty(input.config.keyloadoperation)) {
                    item.input[input.config.keyloadoperation] = menu.command_id;
                }

                if (input.config.key_selected && item.input.hasOwnProperty(input.config.key_selected)) {
                    item.input[input.config.key_selected] = serviceid;
                }
            });
        });

        try {
            // Gọi API lấy danh sách operation
            const response = await workflowService.runBODynamic({
                sessiontoken: session?.user?.token as string,
                txFo: loadoperation,
            });

            if (response.status === 200 && response.payload?.dataresponse) {
                const operationsData = response.payload.dataresponse.data.input?.data.operation_body || [];
                setOperations(operationsData);
            } else {
                console.warn("⚠️ No operations found for this menu!");
                setOperations([]);
            }
        } catch (error) {
            console.error("❌ Error fetching operations:", error);
            setOperations([]);
        }
    };

    return (
        <Grid container size={12} spacing={2}>
            <Grid size={3}>
                <Box
                    sx={{
                        border: "1px solid #09633F",
                        borderRadius: 2,
                        mb: 5,
                        boxShadow: 1,
                        overflow: "hidden",
                    }}
                >

                    <Box
                        sx={{
                            backgroundColor: "#09633F",
                            color: "white",
                            px: 3,
                            py: 1.5,
                            borderBottom: "1px solid #ffffff",
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: "bold",
                                color: "white",
                                '&.MuiTypography-root': {
                                    display: 'block',
                                    textAlign: 'left',
                                },
                            }}
                        >
                            {dictionary['common'].menu}
                        </Typography>
                    </Box>
                    <Box>
                        {menuParent.map(parent => {
                            const hasSubMenu = menuData.some(child => child.parent_id === parent.command_id);

                            return hasSubMenu ? (
                                <Accordion key={parent.command_id} expanded={expandedMenu === parent.command_id} onChange={() => toggleMenu(parent.command_id)}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography fontWeight="bold">{parent.command_name}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pl: 5 }}>
                                        <List>
                                            {menuData
                                                .filter(child => child.parent_id === parent.command_id)
                                                .map((child, index, array) => (
                                                    <ListItem
                                                        key={child.command_id}
                                                        sx={{
                                                            borderBottom: index !== array.length - 1 ? '1px solid #ddd' : 'none',
                                                            cursor: 'pointer',
                                                            color: selectedMenu?.command_id === child.command_id ? '#0a9150' : 'transparent',
                                                        }}
                                                        onClick={() => handleMenuClick(child)}
                                                    >
                                                        <ListItemIcon>
                                                            <FolderIcon
                                                                color={selectedMenu?.command_id === child.command_id ? 'primary' : 'warning'}
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText primary={child.command_name} />
                                                    </ListItem>
                                                ))
                                            }
                                        </List>
                                    </AccordionDetails>

                                </Accordion>
                            ) : (
                                null
                            );
                        })}
                    </Box>
                </Box>
            </Grid>

            <Grid size={9}>
                <Box
                    sx={{
                        border: "1px solid #09633F",
                        borderRadius: 2,
                        mb: 5,
                        boxShadow: 1,
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: "#09633F",
                            color: "white",
                            px: 3,
                            py: 1.5,
                            borderBottom: "1px solid #ffffff",
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: "bold",
                                color: "white",
                                '&.MuiTypography-root': {
                                    display: 'block',
                                    textAlign: 'left',
                                },
                            }}
                        >
                            {dictionary['common'].operation}  {selectedMenu?.command_name}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                            {operations && operations.length > 0 ? (
                                <TableContainer component={Paper} sx={{ maxHeight: 400, border: '1px solid #ddd' }}>
                                <Table stickyHeader sx={{ borderCollapse: 'collapse' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#09633F', borderRight: '1px solid #ddd' }}>Role Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#09633F', textAlign: 'center', borderLeft: '1px solid #ddd' }}>Self Invoke</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {operations.map((operation: any, index: number) => (
                                            <TableRow key={index} sx={{ borderBottom: '1px solid #ddd' }}>
                                                {/* Cột Role Name */}
                                                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd', borderLeft: '1px solid #ddd' }}>
                                                    {operation.role_name}
                                                </TableCell>
                            
                                                {/* Cột Self Invoke */}
                                                <TableCell align="center" sx={{ borderLeft: '1px solid #ddd' }}>
                                                    <Checkbox checked={operation.invoke === 1} color="primary" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            
                            ) : (
                                <Grid size={12} display="flex" justifyContent="center" alignItems="center">
                                    <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Image src="/images/illustrations/empty-list.svg" width={160} height={160} alt="No Transactions" style={{ marginBottom: '20px' }} />
                                        <Typography variant="body1" color="textSecondary">
                                            {dictionary['common'].nooperation}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Box>

            </Grid>


        </Grid >
    );
};

export default RenderPermissionPanel;
