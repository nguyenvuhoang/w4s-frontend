import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { MenuItem, Operation, OperationHeader } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import { Session } from 'next-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

    const toggleMenu = useCallback((menu: string): void => {
        setExpandedMenu(prev => prev === menu ? null : menu);
    }, []);

    const fetchMenuData = useCallback(async (channelId: string): Promise<MenuItem[]> => {
        try {
            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.WF_BO_LOAD_MENU,
                input: {
                    channel_id: channelId
                }
            });
            if (response.status === 200 && response.payload?.dataresponse?.data) {
                const menuItem = response.payload.dataresponse.data.data as MenuItem[];
                return menuItem;
            }
        } catch (error) {
            console.error("Error fetching menu data:", error);
        }
        return [];
    }, [session?.user?.token]);

    const handleMenuClick = useCallback(async (menu: MenuItem): Promise<void> => {
        setSelectedMenu(menu);
        try {
            const response = await workflowService.runFODynamic({
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
                console.warn("âš ï¸ No operations found for this menu!", response);
                setOperations({ operation_header: [], operation_body: [] });
                setCheckboxState({});
                setSelfInvokeState({});
            }
        } catch (error) {
            console.error("âŒ Error fetching operations:", error);
            setOperations({ operation_header: [], operation_body: [] });
            setCheckboxState({});
            setSelfInvokeState({});
        }
    }, [session?.user?.token]);

    useEffect(() => {
        const loadMenuData = async () => {
            const channelId = "BO";
            const data = await fetchMenuData(channelId);
            setMenuParent(data?.filter((item: MenuItem) =>
                item.parent_id === "0" && item.group_menu_visible === "1" && item.group_menu_id === ''
            ));
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
        return operations?.operation_header?.map((header: OperationHeader) => ({
            cmdid: header.cmdid,
            caption: header.caption,
        })) || [];
    }, [operations?.operation_header]);

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

    const handleSelfInvokeChange = useCallback(async (roleName: string, checked: boolean) => {
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

            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.WF_BO_UPDATE_RIGHT,
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
    }, [operations?.operation_body, session?.user?.token, dictionary]);

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
                console.error(`Role ${roleName} or command ${cmdid} not found in operation_body`);
                return;
            }

            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.WF_BO_UPDATE_RIGHT,
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
                    setToastMessage(response.payload.error?.[0]?.info || dictionary['common'].updateerror);
                } else {
                    setToastSeverity('success');
                    setToastMessage(dictionary['common'].updaterolesuccess);
                }
                setToastOpen(true);
            } else {
                console.error(`Failed to update ${cmdid} for ${roleName}:`, response);
            }
        } catch (error) {
            console.error(`Error updating ${cmdid} for ${roleName}:`, error);
        }
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

