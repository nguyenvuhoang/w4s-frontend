import { Locale } from '@/configs/i18n';
import { MenuItem, Operation } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import { Session } from 'next-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildOperationColumns, fetchRoleMenuTree, fetchRoleOperations, filterVisibleParentMenus, submitRoleRights } from './roleOperationApi';

// Äá»‹nh nghÄ©a type cho command trong groupedOperations
interface Command {
    command_id: string;
    command_type: string;
    invoke: number;
    approve: number;
    command_name: string;
}

export interface GroupedOperation {
    [roleName: string]: {
        role_name: string;
        commands: {
            [commandId: string]: Command;
        };
    };
}

export interface DynamicColumn {
    cmdid: string;
    caption: string;
    label?: string;
}

interface UseInvokeApproveProps {
    locale: Locale;
    session: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    tabvalue: number;
}

interface UseInvokeApproveReturn {
    // States
    expandedMenu: string | null;
    selectedMenu: MenuItem | null;
    operations: Operation | undefined;
    menuData: MenuItem[];
    menuParent: MenuItem[];
    checkboxState: { [roleName: string]: { [cmdid: string]: boolean } };
    selfInvokeState: { [roleName: string]: boolean };
    toastOpen: boolean;
    toastSeverity: 'success' | 'error';
    toastMessage: string;

    // Computed values
    groupedOperations: GroupedOperation | undefined;
    dynamicColumns: DynamicColumn[];

    // Handlers
    toggleMenu: (menu: string) => void;
    handleMenuClick: (menu: MenuItem) => Promise<void>;
    handleSelfInvokeChange: (roleName: string, checked: boolean) => Promise<void>;
    handleCommandChange: (roleName: string, cmdid: string, checked: boolean) => Promise<void>;
    handleCloseToast: (event?: React.SyntheticEvent | Event, reason?: string) => void;

    // Utility functions
    getSelfInvokeState: (roleName: string) => boolean;
    getCommandState: (roleName: string, cmdid: string) => boolean | null;
}

export const useInvokeApprove = ({
    locale,
    session,
    dictionary,
    tabvalue
}: UseInvokeApproveProps): UseInvokeApproveReturn => {
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
    const [operations, setOperations] = useState<Operation | undefined>(undefined);
    const [menuData, setMenuData] = useState<MenuItem[]>([]);
    const [menuParent, setMenuParent] = useState<MenuItem[]>([]);
    const [checkboxState, setCheckboxState] = useState<{ [roleName: string]: { [cmdid: string]: boolean } }>({});
    const [selfInvokeState, setSelfInvokeState] = useState<{ [roleName: string]: boolean }>({});
    const [toastOpen, setToastOpen] = useState<boolean>(false);
    const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
    const [toastMessage, setToastMessage] = useState<string>('');
    const operationRequestId = useRef(0);
    const selectedMenuRef = useRef<MenuItem | null>(null);

    const toggleMenu = useCallback((menu: string): void => {
        setExpandedMenu(prev => prev === menu ? null : menu);
    }, []);

    const fetchMenuData = useCallback(async (channelId: string): Promise<MenuItem[]> => (
        fetchRoleMenuTree(session?.user?.token as string, channelId, locale)
    ), [session?.user?.token, locale]);

    const handleMenuClick = useCallback(async (menu: MenuItem): Promise<void> => {
        const requestId = ++operationRequestId.current;
        selectedMenuRef.current = menu;
        setSelectedMenu(menu);
        // Do not display columns from a previously selected menu while its operations load.
        setOperations(undefined);
        setCheckboxState({});
        setSelfInvokeState({});

        const operationsData = await fetchRoleOperations(session?.user?.token as string, menu.command_id, locale);
        // Ignore a late response from an earlier menu selection.
        if (requestId !== operationRequestId.current) return;

        setOperations(operationsData);

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
    }, [locale, session?.user?.token]);

    useEffect(() => {
        const menu = selectedMenuRef.current;
        if (menu) {
            void handleMenuClick(menu);
        }
    }, [handleMenuClick, locale]);

    useEffect(() => {
        const loadMenuData = async () => {
            const channelId = "BO";
            const data = await fetchMenuData(channelId);
            setMenuParent(filterVisibleParentMenus(data));
            setMenuData(data);
        };
        loadMenuData();
    }, [tabvalue, fetchMenuData]);

    const groupedOperations = useMemo((): GroupedOperation | undefined => {
        return operations?.operation_body?.reduce((acc: GroupedOperation, row) => {
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
    }, [operations?.operation_body]);

    const dynamicColumns = useMemo((): DynamicColumn[] => {
        return buildOperationColumns(operations?.operation_header, dictionary['common'].operation);
    }, [dictionary, operations?.operation_header]);

    const getSelfInvokeState = useCallback((roleName: string): boolean => {
        const role = groupedOperations?.[roleName];
        if (!role) return false;
        return Object.values(role.commands).some(cmd => cmd.command_type === 'M' && cmd.invoke === 1);
    }, [groupedOperations]);

    const getCommandState = useCallback((roleName: string, cmdid: string): boolean | null => {
        const role = groupedOperations?.[roleName];
        if (!role) return null;
        const command = role.commands[cmdid];
        if (command && command.command_type === 'C') {
            return command.invoke === 1;
        }
        return null;
    }, [groupedOperations]);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const handleSelfInvokeChange = useCallback(async (roleName: string, checked: boolean) => {
        setSelfInvokeState(prevState => ({
            ...prevState,
            [roleName]: checked
        }));

        try {
            const roleData = operations?.operation_body?.find(row => row.role_name === roleName);
            if (!roleData) {
                return;
            }

            const command = operations?.operation_body?.find(row => row.role_name === roleName && row.command_type === 'M');
            if (!command) {
                return;
            }

            const response = await submitRoleRights({
                sessiontoken: session?.user?.token as string,
                items: [
                    {
                        RoleId: roleData.role_id,
                        CommandId: command.command_id,
                        CommandIdDetail: command.command_id_detail || "A",
                        Invoke: checked,
                        Approve: checked,
                        ChannelId: command.application_code,
                    }
                ]
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
            }
        } catch {}
    }, [operations?.operation_body, session?.user?.token, dictionary]);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const handleCommandChange = useCallback(async (roleName: string, cmdid: string, checked: boolean) => {
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
                return;
            }

            const response = await submitRoleRights({
                sessiontoken: session?.user?.token as string,
                items: [
                    {
                        RoleId: roleData.role_id,
                        CommandId: cmdid,
                        CommandIdDetail: roleData.command_id_detail || "A",
                        Invoke: checked,
                        Approve: checked,
                        ChannelId: roleData.application_code,
                    }
                ]
            });

            if (response.status === 200) {
                const hasError = response.payload.error?.length > 0;
                if (hasError) {
                    setToastSeverity('error');
                    setToastMessage(response.payload.error?.[0]?.info || dictionary['common'].updateerror);
                } else {
                    setToastSeverity('success');
                    setToastMessage(dictionary['common'].updaterolesuccess);
                }
                setToastOpen(true);
            } else {
            }
        } catch {}
    }, [operations?.operation_body, session?.user?.token, dictionary]);

    const handleCloseToast = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setToastOpen(false);
    }, []);

    return {
        // States
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

        // Computed values
        groupedOperations,
        dynamicColumns,

        // Handlers
        toggleMenu,
        handleMenuClick,
        handleSelfInvokeChange,
        handleCommandChange,
        handleCloseToast,

        // Utility functions
        getSelfInvokeState,
        getCommandState,
    };
};

