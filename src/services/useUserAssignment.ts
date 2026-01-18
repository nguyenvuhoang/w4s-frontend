'use client';

import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi, workflowService } from '@/servers/system-service';
import { PageDefaultResponse, UserAccount } from '@/types/bankType';
import { PageData, Role } from '@/types/systemTypes';
import { normalize } from '@/utils/normalize';
import { Session } from 'next-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type Dictionary = Record<string, any>;

export interface User {
    id: number;
    userCode: string;
    username: string;
    roleid?: number;
    firstname?: string;
    middlename?: string;
    lastname?: string;
    fullname: string;
    roleIds?: number[];
}

type Params = {
    session: Session | null;
    dictionary: Dictionary;
    role: PageData<Role>;
    userdata: PageData<UserAccount>;
};

// helpers
const uniqById = <T extends { id: number }>(arr: T[]) => {
    const seen = new Set<number>();
    return arr.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};

const toRoleIdNum = (v: number | '' | string): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
    return null; // '', undefined => not selected
};

const firstNumberOrUndef = (s?: string) => {
    if (!s) return undefined;
    const m = s.match(/\d+/);
    return m ? Number(m[0]) : undefined;
};

export function useUserAssignment({ session, dictionary, role, userdata }: Params) {
    // toast
    const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
    const [toastMessage, setToastMessage] = useState('');
    const [toastOpen, setToastOpen] = useState(false);

    // lists & selections
    const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<number[]>([]);
    const [selectedRight, setSelectedRight] = useState<number[]>([]);

    // filters
    const [filterUserName, setFilterUserName] = useState('');
    const [filterFullname, setFilterFullname] = useState('');
    const [filterAssignedUserName, setFilterAssignedUserName] = useState('');
    const [filterAssignedFullname, setFilterAssignedFullname] = useState('');

    // pickers
    const [selectedUserGroup, setSelectedUserGroup] = useState<number | string>('ALL');
    const [selectedAssignedRoleId, setSelectedAssignedRoleId] = useState<number | ''>('');

    // others
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const userGroups = useMemo(
        () => [{ roleid: 'ALL', rolename: 'All' }, ...role.items],
        [role]
    );

    const token = session?.user?.token as string | undefined;
    const roleIdNum = useMemo<number | null>(() => toRoleIdNum(selectedAssignedRoleId), [selectedAssignedRoleId]);

    // toast helpers
    const showToast = useCallback((severity: 'success' | 'error', msg: string) => {
        setToastSeverity(severity);
        setToastMessage(msg);
        setToastOpen(true);
    }, []);

    const handleCloseToast = useCallback((_e?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setToastOpen(false);
    }, []);

    // API: assign/unassign
    const updateUserRoleAssignment = useCallback(
        async (userIds: string[], roleId: number, isAssign: boolean): Promise<boolean> => {
            try {
                const response = await workflowService.runFODynamic({
                    sessiontoken: token as string,
                    workflowid: WORKFLOWCODE.BO_UPDATE_USER_ROLE_ASSIGNMENT,
                    input: { role_id: roleId, list_of_user: userIds, is_assign: isAssign }
                });

                if (response.status === 200) {
                    const hasError = response.payload.dataresponse.errors.length > 0;
                    if (hasError) {
                        showToast('error', response.payload.error?.[0]?.info || dictionary['common'].updateerror);
                        return false;
                    }
                    showToast('success', dictionary['common'].updaterolesuccess);
                    return true;
                }
                console.error('Failed to assignment user:', response);
                return false;
            } catch (err) {
                console.error('Error updating assignment:', err);
                return false;
            }
        },
        [token, dictionary, showToast]
    );

    // selections
    const handleLeftSelect = useCallback((id: number) => {
        setSelectedLeft(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    }, []);
    const handleRightSelect = useCallback((id: number) => {
        setSelectedRight(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    }, []);

    // assign/unassign handlers (use roleIdNum + uniq)
    const handleAssignOne = useCallback(async () => {
        const firstSelectedUserId = selectedLeft[0];
        const userToAssign = allUsers.find(u => u.id === firstSelectedUserId);
        if (!userToAssign || roleIdNum == null) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment([userToAssign.userCode], roleIdNum, true);
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers(prev => uniqById([...prev, { ...userToAssign, roleid: roleIdNum }]));
            setAllUsers(prev => prev.filter(u => u.id !== userToAssign.id));
            setSelectedLeft(prev => prev.filter(id => id !== userToAssign.id));
        }
    }, [selectedLeft, allUsers, roleIdNum, updateUserRoleAssignment]);

    const handleAssignMany = useCallback(async () => {
        const usersToAssign = (allUsers ?? []).filter(u => selectedLeft.includes(u.id));
        if (usersToAssign.length === 0 || roleIdNum == null) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(usersToAssign.map(u => u.userCode), roleIdNum, true);
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers(prev =>
                uniqById([
                    ...prev,
                    ...usersToAssign.map(u => ({ ...u, roleid: roleIdNum }))
                ])
            );
            setAllUsers(prev => prev.filter(u => !usersToAssign.some(a => a.id === u.id)));
            setSelectedLeft([]);
        }
    }, [allUsers, selectedLeft, roleIdNum, updateUserRoleAssignment]);

    const handleUnassignOne = useCallback(async () => {
        const firstSelectedUserId = selectedRight[0];
        if (!firstSelectedUserId || roleIdNum == null) return;

        const userToUnassign = assignedUsers.find(u => u.id === firstSelectedUserId);
        if (!userToUnassign) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment([userToUnassign.userCode], roleIdNum, false);
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers(prev => prev.filter(u => u.id !== userToUnassign.id));
            setAllUsers(prev => uniqById([...prev, userToUnassign]));
            setSelectedRight(prev => prev.filter(id => id !== userToUnassign.id));
        }
    }, [selectedRight, roleIdNum, assignedUsers, updateUserRoleAssignment]);

    const handleUnassignMany = useCallback(async () => {
        if (selectedRight.length === 0 || roleIdNum == null) return;

        const usersToUnassign = assignedUsers.filter(u => selectedRight.includes(u.id));
        const userCodes = usersToUnassign.map(u => u.userCode);

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(userCodes, roleIdNum, false);
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers(prev => prev.filter(u => !selectedRight.includes(u.id)));
            setAllUsers(prev => uniqById([...prev, ...usersToUnassign]));
            setSelectedRight([]);
        }
    }, [selectedRight, roleIdNum, assignedUsers, updateUserRoleAssignment]);

    // fetch left list (ALL => load all)
    useEffect(() => {
        let aborted = false;
        (async () => {
            setLoadingUsers(true);
            try {
                if (selectedUserGroup === '' || selectedUserGroup === 'ALL') {
                    const initialMapped: User[] = userdata.items.map(u => ({
                        id: u.id,
                        userCode: u.usercode,
                        username: `${u.username}`,
                        roleid: firstNumberOrUndef(u.rolechannel),
                        firstname: u.firstname,
                        middlename: u.middlename,
                        lastname: u.lastname,
                        fullname: `${u.firstname ?? ''} ${u.middlename ?? ''} ${u.lastname ?? ''}`.trim()
                    }));
                    if (!aborted) setAllUsers(uniqById(initialMapped));
                } else {
                    const response = await systemServiceApi.runFODynamic({
                        sessiontoken: token as string,
                        workflowid: WORKFLOWCODE.BO_GET_USER_BY_ROLE,
                        input: { role_id: selectedUserGroup }
                    });

                    const user = response.status === 200 && response.payload?.dataresponse
                        ? response.payload.dataresponse.data.input.data ?? []
                        : [];

                    const mapped: User[] = user.map((u: any) => ({
                        id: u.id,
                        userCode: u.user_code,
                        username: `${u.user_name}`,
                        roleid: toRoleIdNum(String(selectedUserGroup)) ?? undefined,
                        firstname: u.first_name,
                        middlename: u.middle_name,
                        lastname: u.last_name,
                        fullname: `${u.first_name ?? ''} ${u.middle_name ?? ''} ${u.last_name ?? ''}`.trim()
                    }));
                    if (!aborted) setAllUsers(uniqById(mapped));
                }
            } catch (err) {
                console.error('Error fetching users by role:', err);
                if (!aborted) setAllUsers([]);
            } finally {
                if (!aborted) setLoadingUsers(false);
            }
        })();
        return () => { aborted = true; };
    }, [selectedUserGroup, token, userdata]);

    // fetch right list (by roleIdNum)
    useEffect(() => {
        let aborted = false;
        (async () => {
            if (roleIdNum == null) { if (!aborted) setAssignedUsers([]); return; }
            try {
                const response = await workflowService.runFODynamic({
                    sessiontoken: token as string,
                    workflowid: WORKFLOWCODE.BO_GET_USER_BY_ROLE,
                    input: { role_id: roleIdNum }
                });

                const data = response.status === 200 ? response.payload?.dataresponse?.data.data : [];
                if (!Array.isArray(data)) { if (!aborted) setAssignedUsers([]); return; }

                const mapped: User[] = data.map((u: any) => ({
                    id: u.id,
                    userCode: u.user_code,
                    username: `${u.user_name}`,
                    roleid: roleIdNum,
                    firstname: u.first_name,
                    middlename: u.middle_name,
                    lastname: u.last_name,
                    fullname: `${u.first_name ?? ''} ${u.middle_name ?? ''} ${u.last_name ?? ''}`.trim()
                }));
                if (!aborted) setAssignedUsers(uniqById(mapped));
            } catch (err) {
                console.error('Error fetching assigned users:', err);
                if (!aborted) setAssignedUsers([]);
            }
        })();
        return () => { aborted = true; };
    }, [roleIdNum, token]);

    // filter left list
    const filteredUsers = useMemo(() => {
        const groupId: number | null = (() => {
            if (typeof selectedUserGroup === 'number') return selectedUserGroup;
            if (typeof selectedUserGroup === 'string' && /^\d+$/.test(selectedUserGroup)) return Number(selectedUserGroup);
            return null; // 'ALL' hoặc ''
        })();

        const userNameQuery = filterUserName.trim().toLowerCase();
        const fullNameQuery = normalize(filterFullname);

        return (allUsers ?? []).filter(user => {
            const inGroup =
                groupId == null ||
                (Array.isArray((user as any).roleIds) && (user as any).roleIds?.includes(groupId)) ||
                user.roleid === groupId;

            const matchUser = (user.username ?? '').toLowerCase().includes(userNameQuery);

            const raw = `${user.firstname ?? ''} ${user.middlename ?? ''} ${user.lastname ?? ''}`.trim();
            const candidate = raw.length ? raw : (user.fullname ?? '');
            const matchFullname = normalize(candidate).includes(fullNameQuery);

            return inGroup && matchUser && matchFullname;
        });
    }, [allUsers, selectedUserGroup, filterUserName, filterFullname]);

    // filter right list (by roleIdNum)
    const filteredAssignedUsers = useMemo(() => {
        const matchRole = (u: User) => roleIdNum == null || u.roleid === roleIdNum;

        const userNameQuery = filterAssignedUserName.trim().toLowerCase();
        const fullNameQuery = normalize(filterAssignedFullname);

        return (assignedUsers ?? []).filter(user => {
            const okRole = matchRole(user);
            const okUser = (user.username ?? '').toLowerCase().includes(userNameQuery);

            const raw = `${user.firstname ?? ''} ${user.middlename ?? ''} ${user.lastname ?? ''}`.trim();
            const candidate = raw.length ? raw : (user.fullname ?? '');
            const okFull = normalize(candidate).includes(fullNameQuery);

            return okRole && okUser && okFull;
        });
    }, [assignedUsers, roleIdNum, filterAssignedUserName, filterAssignedFullname]);

    return {
        // lists
        allUsers, assignedUsers, loadingUsers,
        // selections
        selectedLeft, selectedRight, handleLeftSelect, handleRightSelect,
        // filters & setters
        filterUserName, setFilterUserName,
        filterFullname, setFilterFullname,
        filterAssignedUserName, setFilterAssignedUserName,
        filterAssignedFullname, setFilterAssignedFullname,
        filteredUsers, filteredAssignedUsers,
        // role pickers
        userGroups, selectedUserGroup, setSelectedUserGroup,
        selectedAssignedRoleId, setSelectedAssignedRoleId,
        // actions
        handleAssignOne, handleAssignMany,
        handleUnassignOne, handleUnassignMany,
        isAssigning,
        // toast
        toastOpen, toastMessage, toastSeverity, handleCloseToast,
    };
}
