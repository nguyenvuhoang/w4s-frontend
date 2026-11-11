import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { Locale } from '@/configs/i18n';
import { MenuItem } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Session } from 'next-auth';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { DynamicColumn, useInvokeApprove } from '../../../services/useInvokeApprove';
import type { UserRolePermissionItem } from '@/features/system-settings/user-roles/types';
import { userRoleText } from '@/features/system-settings/user-roles/components/userRoleHelpers';

type Props = {
    locale: Locale;
    session?: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    tabvalue?: number;
    readOnly?: boolean;
    rights?: UserRolePermissionItem[];
};

type ReadonlyMenuNode = UserRolePermissionItem & { children: ReadonlyMenuNode[] };

// Backend localizes `label` by request `lang` (WF_BO role rights); render it directly.
const getReadonlyMenuName = (item: UserRolePermissionItem) => item.label || item.command_id;

const buildReadonlyMenuTree = (rights: UserRolePermissionItem[]) => {
    const nodes = new Map<string, ReadonlyMenuNode>();
    rights.filter(item => item.command_type === 'M').forEach(item => nodes.set(item.command_id, { ...item, children: [] }));

    const roots: ReadonlyMenuNode[] = [];
    nodes.forEach(node => {
        const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
        if (parent) parent.children.push(node);
        else roots.push(node);
    });

    const sortNodes = (items: ReadonlyMenuNode[]) => {
        items.sort((left, right) => (left.display_order ?? Number.MAX_SAFE_INTEGER) - (right.display_order ?? Number.MAX_SAFE_INTEGER) || left.command_id.localeCompare(right.command_id));
        items.forEach(node => sortNodes(node.children));
        return items;
    };

    return sortNodes(roots);
};

const ReadonlyMenuItems = ({ nodes, depth, selectedMenu, expandedMenu, onToggle, onSelect }: {
    nodes: ReadonlyMenuNode[];
    depth: number;
    selectedMenu: ReadonlyMenuNode | null;
    expandedMenu: string | null;
    onToggle: (commandId: string) => void;
    onSelect: (menu: ReadonlyMenuNode) => void;
}) => (
    <List sx={{ pl: depth === 0 ? 0 : 2 }}>
        {nodes.map(node => {
            const isSelected = selectedMenu?.command_id === node.command_id;

            return node.children.length > 0 ? (
                <Accordion key={node.command_id} expanded={expandedMenu === node.command_id} onChange={() => onToggle(node.command_id)} sx={{ bgcolor: 'white' }}>
                    <AccordionSummary sx={{ pl: depth === 0 ? 5 : 3, color: '#225087' }} expandIcon={<ExpandMoreIcon />}>
                        <ListItemIcon><AccountTreeIcon sx={{ color: '#225087' }} /></ListItemIcon>
                        <Typography fontWeight="bold" sx={{ color: '#225087', mx: 2 }}>{getReadonlyMenuName(node)}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pl: depth === 0 ? 5 : 3, color: '#225087', pt: 0 }}>
                        <ReadonlyMenuItems nodes={node.children} depth={depth + 1} selectedMenu={selectedMenu} expandedMenu={expandedMenu} onToggle={onToggle} onSelect={onSelect} />
                    </AccordionDetails>
                </Accordion>
            ) : (
                <ListItem key={node.command_id} sx={{ cursor: 'pointer', color: isSelected ? '#0a9150' : 'inherit', pl: depth === 0 ? 5 : 3 }} onClick={() => onSelect(node)}>
                    <ListItemIcon><FolderIcon color={isSelected ? 'primary' : 'warning'} /></ListItemIcon>
                    <ListItemText primary={getReadonlyMenuName(node)} slotProps={{ primary: { style: { color: '#225087', fontWeight: isSelected ? 700 : 400 } } }} />
                </ListItem>
            );
        })}
    </List>
);

const ReadonlyInvokeApprove = ({ dictionary, rights = [] }: Props) => {
    const [selectedMenu, setSelectedMenu] = useState<ReadonlyMenuNode | null>(null);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const menuParent = useMemo(() => buildReadonlyMenuTree(rights), [rights]);
    const actions = selectedMenu
        ? rights.filter(item => item.command_type === 'C' && item.parent_id === selectedMenu.command_id)
            .sort((left, right) => (left.display_order ?? Number.MAX_SAFE_INTEGER) - (right.display_order ?? Number.MAX_SAFE_INTEGER) || left.command_id.localeCompare(right.command_id))
        : [];
    const operationTitle = dictionary.common?.operation || userRoleText(dictionary, 'permission_operation_title', 'Operation');

    return (
        <Box>
            <Grid container size={12} spacing={2} marginTop={2} sx={{ flexGrow: 1 }}>
                <Grid size={3}>
                    <Box sx={{ border: '1px solid #225087', borderRadius: 2, mb: 5, boxShadow: 1, overflow: 'hidden' }}>
                        <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 1.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', '&.MuiTypography-root': { display: 'block', textAlign: 'left' } }}>
                                {dictionary.common?.menu || userRoleText(dictionary, 'permission_menu_title', 'Menu')}
                            </Typography>
                        </Box>
                        <Box><ReadonlyMenuItems nodes={menuParent} depth={0} selectedMenu={selectedMenu} expandedMenu={expandedMenu} onToggle={commandId => setExpandedMenu(current => current === commandId ? null : commandId)} onSelect={setSelectedMenu} /></Box>
                    </Box>
                </Grid>

                <Grid size={9}>
                    <Box sx={{ border: '1px solid #225087', borderRadius: 2, mb: 5, boxShadow: 1, overflow: 'hidden' }}>
                        <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 1.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', '&.MuiTypography-root': { display: 'block', textAlign: 'left' } }}>
                                {operationTitle}{selectedMenu ? ` ${getReadonlyMenuName(selectedMenu)}` : ''}
                            </Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {selectedMenu && actions.length > 0 ? (
                                <TableContainer component={Paper} sx={{ maxHeight: 600, border: '1px solid #ddd' }}>
                                    <Table stickyHeader sx={{ borderCollapse: 'collapse' }}>
                                        <TableHead><TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white', borderRight: '1px solid #ddd', background: '#225087' }}>{userRoleText(dictionary, 'permission_action_column', 'Function')}</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center', borderRight: '1px solid #ddd', background: '#225087' }}>{userRoleText(dictionary, 'permission_invoke', 'Invoke')}</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center', background: '#225087' }}>{userRoleText(dictionary, 'permission_approve', 'Approve')}</TableCell>
                                        </TableRow></TableHead>
                                        <TableBody>{actions.map((action, index) => <TableRow key={action.command_id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff', '&:hover': { backgroundColor: '#f1f1f1' }, '& td': { borderBottom: '1px solid #e0e0e0' } }}>
                                            <TableCell sx={{ borderRight: '1px solid #ddd', background: 'white', color: '#225087' }}>{getReadonlyMenuName(action)}</TableCell>
                                            <TableCell sx={{ borderRight: '1px solid #ddd', textAlign: 'center' }}><Checkbox checked={action.invoke} disabled /></TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}><Checkbox checked={action.approve} disabled /></TableCell>
                                        </TableRow>)}</TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Grid size={12} display="flex" justifyContent="center" alignItems="center">
                                    <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Image src="/images/illustrations/empty-list.svg" width={160} height={160} alt="" style={{ marginBottom: '20px' }} priority />
                                        <Typography variant="body1" color="#0a9150">{dictionary.common?.nooperation || userRoleText(dictionary, 'permission_no_operation', 'No operation configured')}</Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

const EditableInvokeApprove = ({ locale, session, dictionary, tabvalue = 0 }: Props) => {
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
    } = useInvokeApprove({ locale, session: session ?? null, dictionary, tabvalue });

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
                                const mainmenu = parent.children || [];
                                if (mainmenu.length > 0) {
                                    const label = parent.label || parent.command_name || parent.command_id;
                                    return (
                                        <Accordion
                                            key={parent.command_id}
                                            expanded={expandedMenu === parent.command_id}
                                            onChange={() => toggleMenu(parent.command_id)}
                                            sx={{ bgcolor: 'white' }}
                                        >
                                            <AccordionSummary sx={{ pl: 5, color: '#225087' }} expandIcon={<ExpandMoreIcon />}>
                                                <ListItemIcon>
                                                    <AccountTreeIcon sx={{ color: '#225087' }} />
                                                </ListItemIcon>
                                                <Typography fontWeight="bold" sx={{ color: '#225087', mx: 2 }}>
                                                    {label}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pl: 5, color: '#225087' }}>
                                                <List>
                                                    {mainmenu?.map(child => {
                                                        const childlabel = child.label || child.command_name || child.command_id;
                                                        return (
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
                                                                    primary={childlabel}
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
                                                        )
                                                    })}
                                                </List>
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                }

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
                                                primary={parent.label || parent.command_name || parent.command_id}
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
                                {dictionary['common'].operation} {selectedMenu ? (selectedMenu.label || selectedMenu.command_name || selectedMenu.command_id) : ''}
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
                                                        <TableCell key={col.cmdid} sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center', borderRight: '1px solid #ddd', background: "#225087" }}>{col.label || col.caption}</TableCell>
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

const InvokeApprove = (props: Props) => (
    props.readOnly ? <ReadonlyInvokeApprove {...props} /> : <EditableInvokeApprove {...props} />
);

export default InvokeApprove;
