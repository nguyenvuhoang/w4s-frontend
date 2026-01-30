import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { Locale } from '@/configs/i18n';
import { MenuItem } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import { getLocalizedName } from '@utils/getLocalizedName';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Session } from 'next-auth';
import Image from 'next/image';
import { DynamicColumn, useInvokeApprove } from '../../../services/useInvokeApprove';

type Props = {
    locale: Locale;
    session: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    tabvalue: number;
};

const InvokeApprove = ({ locale, session, dictionary, tabvalue }: Props) => {
    const {
        expandedMenu,
        selectedMenu,
        operations,
        menuData,
        menuParent,
        checkboxState,
        selfInvokeState,
        toastOpen,
        toastSeverity,
        toastMessage,
        groupedOperations,
        dynamicColumns,
        toggleMenu,
        handleMenuClick,
        handleSelfInvokeChange,
        handleCommandChange,
        handleCloseToast,
        getSelfInvokeState,
        getCommandState,
    } = useInvokeApprove({ locale, session, dictionary, tabvalue });

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

                                // CÃ³ children -> Accordion nhÆ° cÅ©
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
                                                    {/* Parent cÃ³ children dÃ¹ng RootIcon */}
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

                                // KHÃ”NG cÃ³ children -> render ListItem trá»±c tiáº¿p Ä‘á»ƒ tick quyá»n cho PARENT
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
