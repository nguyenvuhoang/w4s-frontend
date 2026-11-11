'use client';

import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { UserAccount } from '@shared/types/bankType';
import { PageData, Role } from '@shared/types/systemTypes';
import { SelectChangeEvent } from '@mui/material';
import { Session } from 'next-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type FetchUsersResult = {
    users: User[];
    total: number;
    totalPages: number;
};

// helpers
// Page size khi gom toàn bộ dataset cho "Chọn tất cả" (không phụ thuộc page đang xem).
const SELECT_ALL_PAGE_SIZE = 200;

const uniqById = <T extends { id: number }>(arr: T[]) => {
    const seen = new Set<number>();
    return arr.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};

const toRoleIdNum = (v: number | '' | string): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
    return null; // '', undefined => not selected
};

// Fields đôi khi trả về theo cả snake_case và camelCase tuỳ workflow, nên phải dò nhiều key.
const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined;

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key];
    }

    return undefined;
};

const toNumber = (value: any, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getResponseRoot = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse;
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data ?? response;

    return data?.data ?? data?.input?.data ?? data?.input ?? data;
};

const getErrors = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse;

    return dataresponse?.errors ?? dataresponse?.error ?? response?.payload?.errors ?? response?.errors ?? [];
};

const getExecutionId = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse;
    const errors = getErrors(response);
    const error = Array.isArray(errors) ? errors[0] : null;

    return error?.execution_id ?? error?.executionid ?? dataresponse?.execution_id ?? dataresponse?.executionid ?? '';
};

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.items)) return root.items;
    if (Array.isArray(root?.data)) return root.data;

    return [];
};

const mapSearchUser = (item: any, roleid?: number): User => {
    const firstname = String(getField(item, ['first_name', 'firstName']) ?? '');
    const middlename = String(getField(item, ['middle_name', 'middleName']) ?? '');
    const lastname = String(getField(item, ['last_name', 'lastName']) ?? '');

    return {
        id: toNumber(getField(item, ['id']), 0),
        userCode: String(getField(item, ['user_code', 'userCode']) ?? ''),
        username: String(getField(item, ['user_name', 'userName']) ?? ''),
        roleid,
        firstname,
        middlename,
        lastname,
        fullname: `${firstname} ${middlename} ${lastname}`.trim()
    };
};

const mapAccountToUser = (u: UserAccount): User => ({
    id: u.id,
    userCode: u.usercode,
    username: `${u.username}`,
    firstname: u.firstname,
    middlename: u.middlename,
    lastname: u.lastname,
    fullname: `${u.firstname ?? ''} ${u.middlename ?? ''} ${u.lastname ?? ''}`.trim()
});

/**
 * Select-All dùng chung cho cả 2 bảng (available users bên trái & assigned users bên phải).
 *
 * - "universe" = TOÀN BỘ bản ghi khớp filter hiện tại (gom hết các trang), không phải trang đang xem.
 * - checked  : đã chọn hết universe.
 * - indeterminate: chọn một phần universe.
 * - onToggleAll: tick -> merge toàn bộ universe vào selection; bỏ tick -> clear sạch selection.
 * - refresh(): nạp lại universe (gọi sau khi assign/unassign để trạng thái 2 bên cập nhật đúng).
 *
 * Selection state (ids + details) do hook cha giữ nên đổi trang / search không làm mất lựa chọn.
 */
function useSelectAllUniverse({
    enabled,
    reloadSignature,
    loadUniverse,
    selectedIds,
    setSelectedIds,
    setSelectedDetails
}: {
    enabled: boolean;
    reloadSignature: string;
    loadUniverse: () => Promise<User[]>;
    selectedIds: number[];
    setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
    setSelectedDetails: React.Dispatch<React.SetStateAction<Record<number, User>>>;
}) {
    const [universe, setUniverse] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // luôn gọi bản loader mới nhất mà không cần đưa vào dependency của effect
    const loadRef = useRef(loadUniverse);
    loadRef.current = loadUniverse;

    useEffect(() => {
        if (!enabled) {
            setUniverse([]);
            setLoaded(true);
            setLoading(false);
            return;
        }

        let aborted = false;
        setLoading(true);
        setLoaded(false);

        (async () => {
            try {
                const list = await loadRef.current();
                if (!aborted) {
                    setUniverse(list);
                    setLoaded(true);
                }
            } catch {
                if (!aborted) {
                    setUniverse([]);
                    setLoaded(true);
                }
            } finally {
                if (!aborted) setLoading(false);
            }
        })();

        return () => { aborted = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, reloadSignature, refreshKey]);

    const selectedInUniverseCount = useMemo(() => {
        if (universe.length === 0) return 0;
        const set = new Set(selectedIds);
        return universe.reduce((count, user) => count + (set.has(user.id) ? 1 : 0), 0);
    }, [universe, selectedIds]);

    const checked = enabled && loaded && universe.length > 0 && selectedInUniverseCount === universe.length;
    const indeterminate = selectedInUniverseCount > 0 && !checked;
    const selectAllLoading = enabled && (loading || !loaded);

    const onToggleAll = useCallback(() => {
        if (checked) {
            // Bỏ Tick All -> clear toàn bộ selection (mọi trang, mọi filter)
            setSelectedIds([]);
            setSelectedDetails({});
            return;
        }

        // Tick All -> chọn toàn bộ universe của filter hiện tại, gộp với selection cũ
        setSelectedIds(prev => {
            const merged = new Set(prev);
            universe.forEach(user => merged.add(user.id));
            return Array.from(merged);
        });
        setSelectedDetails(prev => {
            const next = { ...prev };
            universe.forEach(user => { next[user.id] = user; });
            return next;
        });
    }, [checked, universe, setSelectedIds, setSelectedDetails]);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    return { checked, indeterminate, selectAllLoading, onToggleAll, refresh };
}

export function useUserAssignment({ session, dictionary, role, userdata }: Params) {
    // toast
    const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
    const [toastMessage, setToastMessage] = useState('');
    const [toastOpen, setToastOpen] = useState(false);

    // lists & selections (đây là dữ liệu của TRANG hiện tại - server-side pagination)
    const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<number[]>([]);
    const [selectedRight, setSelectedRight] = useState<number[]>([]);
    // Lưu luôn user object theo id để không mất dữ liệu khi user đã chọn rồi chuyển trang khác
    const [selectedLeftDetails, setSelectedLeftDetails] = useState<Record<number, User>>({});
    const [selectedRightDetails, setSelectedRightDetails] = useState<Record<number, User>>({});

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
    const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    // pagination - bảng bên trái (available users)
    const [currentPageLeft, setCurrentPageLeft] = useState(1);
    const [pageSizeLeft, setPageSizeLeft] = useState(10);
    const [totalCountLeft, setTotalCountLeft] = useState<number>(userdata.total_count ?? userdata.items.length);
    const [totalPagesLeft, setTotalPagesLeft] = useState<number>(userdata.total_pages ?? 1);
    const [jumpPageLeft, setJumpPageLeft] = useState(1);

    // pagination - bảng bên phải (assigned users)
    const [currentPageRight, setCurrentPageRight] = useState(1);
    const [pageSizeRight, setPageSizeRight] = useState(10);
    const [totalCountRight, setTotalCountRight] = useState(0);
    const [totalPagesRight, setTotalPagesRight] = useState(0);
    const [jumpPageRight, setJumpPageRight] = useState(1);

    // User Assignment (BO) không được chọn role thuộc Service MB (dành riêng cho Mobile User Assignment).
    const assignableRoles = useMemo(
        () => role.items.filter(r => r.serviceid !== 'MB'),
        [role]
    );

    const userGroups = useMemo(
        () => [{ roleid: 'ALL', rolename: 'All' }, ...assignableRoles],
        [assignableRoles]
    );

    const token = session?.user?.token as string | undefined;
    const roleIdNum = useMemo<number | null>(() => toRoleIdNum(selectedAssignedRoleId), [selectedAssignedRoleId]);

    // Một ô search bất kỳ cũng dùng chung 1 search_text cho cả list lẫn "universe" của select-all.
    const leftSearchText = filterUserName || filterFullname;
    const rightSearchText = filterAssignedUserName || filterAssignedFullname;

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

    // API: tìm kiếm toàn bộ user BO (server-side pagination)
    const fetchUsersSearch = useCallback(
        async (page: number, size: number, searchtext: string): Promise<FetchUsersResult> => {
            try {
                const response = await workflowService.runFODynamic({
                    sessiontoken: token as string,
                    workflowid: WORKFLOWCODE.WF_BO_SIMPLE_SEARCH_USER,
                    input: {
                        page_size: size,
                        page_index: Math.max(page - 1, 0),
                        search_text: searchtext,
                        channel_code: 'BO'
                    }
                });

                if (response?.status !== 200) {
                    return { users: [], total: 0, totalPages: 0 };
                }

                const errors = getErrors(response);
                if (Array.isArray(errors) && errors.length > 0) {
                    return { users: [], total: 0, totalPages: 0 };
                }

                const root = getResponseRoot(response);
                const total = toNumber(getField(root, ['total_count', 'totalCount']), 0);
                const totalPages = toNumber(getField(root, ['total_pages', 'totalPages']), 0);
                const users = uniqById(pickItems(root).map(item => mapSearchUser(item)));

                return { users, total, totalPages };
            } catch {
                return { users: [], total: 0, totalPages: 0 };
            }
        },
        [token]
    );

    // API: user thuộc 1 role - dùng cho cả "select user group" bên trái và danh sách đã gán bên phải
    const fetchUsersByRole = useCallback(
        async (roleId: number, page: number, size: number, searchtext: string): Promise<FetchUsersResult> => {
            if (!roleId) return { users: [], total: 0, totalPages: 0 };

            try {
                const response = await workflowService.runFODynamic({
                    sessiontoken: token as string,
                    workflowid: WORKFLOWCODE.BO_GET_USER_BY_ROLE,
                    input: {
                        role_id: roleId,
                        page_size: size,
                        page_index: Math.max(page - 1, 0),
                        search_text: searchtext
                    }
                });

                if (response?.status !== 200) {
                    return { users: [], total: 0, totalPages: 0 };
                }

                const errors = getErrors(response);
                if (Array.isArray(errors) && errors.length > 0) {
                    return { users: [], total: 0, totalPages: 0 };
                }

                const root = getResponseRoot(response);
                const items = pickItems(root);
                const total = toNumber(getField(root, ['total_count', 'totalCount']), items.length);
                const totalPages = toNumber(
                    getField(root, ['total_pages', 'totalPages']),
                    size > 0 ? Math.ceil(total / size) : 1
                );
                const users = uniqById(items.map(item => mapSearchUser(item, roleId)));

                return { users, total, totalPages };
            } catch {
                return { users: [], total: 0, totalPages: 0 };
            }
        },
        [token]
    );

    // Gom tất cả các trang của một API search thành 1 mảng (phục vụ "Chọn tất cả" - không phụ thuộc trang đang xem).
    const collectAllPages = useCallback(
        async (fetchPage: (pageIndexOneBased: number) => Promise<FetchUsersResult>): Promise<User[]> => {
            const acc: User[] = [];
            let page = 1;
            let total = Infinity;

            // Guard 200 trang để tránh vòng lặp vô hạn nếu API trả về total bất thường
            while (acc.length < total && page <= 200) {
                const result = await fetchPage(page);

                if (result.users.length === 0) break;

                acc.push(...result.users);
                total = result.total > 0 ? result.total : acc.length;
                page += 1;
            }

            return uniqById(acc);
        },
        []
    );

    // Universe bảng trái: toàn bộ user theo group + search hiện tại.
    const fetchAllLeftUsers = useCallback(
        (group: number | string, searchtext: string): Promise<User[]> => {
            const isDefaultGroup = group === '' || group === 'ALL';
            const roleId = isDefaultGroup ? 0 : (toRoleIdNum(String(group)) ?? 0);

            if (!isDefaultGroup && !roleId) return Promise.resolve([]);

            return collectAllPages(p =>
                isDefaultGroup
                    ? fetchUsersSearch(p, SELECT_ALL_PAGE_SIZE, searchtext)
                    : fetchUsersByRole(roleId, p, SELECT_ALL_PAGE_SIZE, searchtext)
            );
        },
        [collectAllPages, fetchUsersSearch, fetchUsersByRole]
    );

    // Universe bảng phải: toàn bộ user đã gán role đang chọn + search hiện tại.
    const fetchAllRightUsers = useCallback(
        (roleId: number, searchtext: string): Promise<User[]> => {
            if (!roleId) return Promise.resolve([]);

            return collectAllPages(p => fetchUsersByRole(roleId, p, SELECT_ALL_PAGE_SIZE, searchtext));
        },
        [collectAllPages, fetchUsersByRole]
    );

    const loadLeftUniverse = useCallback(
        () => fetchAllLeftUsers(selectedUserGroup, leftSearchText),
        [fetchAllLeftUsers, selectedUserGroup, leftSearchText]
    );

    const loadRightUniverse = useCallback(
        () => (roleIdNum == null ? Promise.resolve([]) : fetchAllRightUsers(roleIdNum, rightSearchText)),
        [fetchAllRightUsers, roleIdNum, rightSearchText]
    );

    // Cùng 1 helper Select All cho cả 2 bảng (chọn toàn bộ dataset/filter, giữ selection qua search/pagination).
    const leftSelectAll = useSelectAllUniverse({
        enabled: true,
        reloadSignature: `${selectedUserGroup}|${leftSearchText}|${token ?? ''}`,
        loadUniverse: loadLeftUniverse,
        selectedIds: selectedLeft,
        setSelectedIds: setSelectedLeft,
        setSelectedDetails: setSelectedLeftDetails
    });

    const rightSelectAll = useSelectAllUniverse({
        enabled: roleIdNum != null,
        reloadSignature: `${roleIdNum ?? ''}|${rightSearchText}|${token ?? ''}`,
        loadUniverse: loadRightUniverse,
        selectedIds: selectedRight,
        setSelectedIds: setSelectedRight,
        setSelectedDetails: setSelectedRightDetails
    });

    // refresh() từ helper là stable (useCallback rỗng) nên tách ra để dependency của các handler bên dưới ổn định.
    const refreshLeftUniverse = leftSelectAll.refresh;
    const refreshRightUniverse = rightSelectAll.refresh;
    const refreshSelectAllUniverses = useCallback(() => {
        refreshLeftUniverse();
        refreshRightUniverse();
    }, [refreshLeftUniverse, refreshRightUniverse]);

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
                return false;
            } catch {
                return false;
            }
        },
        [token, dictionary, showToast]
    );

    // selections - lưu luôn user object để khi assign/unassign vẫn dùng được dù đã sang trang khác
    const handleLeftSelect = useCallback((user: User) => {
        setSelectedLeft(prev => (prev.includes(user.id) ? prev.filter(x => x !== user.id) : [...prev, user.id]));
        setSelectedLeftDetails(prev => {
            if (prev[user.id]) {
                const { [user.id]: _removed, ...rest } = prev;
                return rest;
            }
            return { ...prev, [user.id]: user };
        });
    }, []);

    const handleRightSelect = useCallback((user: User) => {
        setSelectedRight(prev => (prev.includes(user.id) ? prev.filter(x => x !== user.id) : [...prev, user.id]));
        setSelectedRightDetails(prev => {
            if (prev[user.id]) {
                const { [user.id]: _removed, ...rest } = prev;
                return rest;
            }
            return { ...prev, [user.id]: user };
        });
    }, []);

    // Tải lại đúng trang hiện tại; nếu trang đó rỗng (vừa assign/unassign hết item cuối) thì lùi về trang trước
    const reloadLeftPage = useCallback(async (page: number) => {
        setLoadingUsers(true);
        try {
            const searchtext = filterUserName || filterFullname;
            const isDefaultGroup = selectedUserGroup === '' || selectedUserGroup === 'ALL';
            const fetchPage = (p: number) => (
                isDefaultGroup
                    ? fetchUsersSearch(p, pageSizeLeft, searchtext)
                    : fetchUsersByRole(toRoleIdNum(String(selectedUserGroup)) ?? 0, p, pageSizeLeft, searchtext)
            );

            let result = await fetchPage(page);
            let finalPage = page;
            if (result.users.length === 0 && page > 1) {
                finalPage = page - 1;
                result = await fetchPage(finalPage);
            }

            setAllUsers(result.users);
            setTotalCountLeft(result.total);
            setTotalPagesLeft(result.totalPages);
            if (finalPage !== page) {
                setCurrentPageLeft(finalPage);
                setJumpPageLeft(finalPage);
            }
        } finally {
            setLoadingUsers(false);
        }
    }, [selectedUserGroup, pageSizeLeft, filterUserName, filterFullname, fetchUsersSearch, fetchUsersByRole]);

    const reloadRightPage = useCallback(async (page: number) => {
        if (roleIdNum == null) return;

        setLoadingAssignedUsers(true);
        try {
            const searchtext = filterAssignedUserName || filterAssignedFullname;
            let result = await fetchUsersByRole(roleIdNum, page, pageSizeRight, searchtext);
            let finalPage = page;
            if (result.users.length === 0 && page > 1) {
                finalPage = page - 1;
                result = await fetchUsersByRole(roleIdNum, finalPage, pageSizeRight, searchtext);
            }

            setAssignedUsers(result.users);
            setTotalCountRight(result.total);
            setTotalPagesRight(result.totalPages);
            if (finalPage !== page) {
                setCurrentPageRight(finalPage);
                setJumpPageRight(finalPage);
            }
        } finally {
            setLoadingAssignedUsers(false);
        }
    }, [roleIdNum, pageSizeRight, filterAssignedUserName, filterAssignedFullname, fetchUsersByRole]);

    // assign/unassign handlers (dùng selected*Details nên vẫn thao tác được với user đã chọn ở trang khác)
    const handleAssignOne = useCallback(async () => {
        const firstSelectedUserId = selectedLeft[0];
        const userToAssign = selectedLeftDetails[firstSelectedUserId];
        if (!userToAssign || roleIdNum == null) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment([userToAssign.userCode], roleIdNum, true);
        setIsAssigning(false);

        if (ok) {
            setSelectedLeft(prev => prev.filter(id => id !== userToAssign.id));
            setSelectedLeftDetails(prev => {
                const { [userToAssign.id]: _removed, ...rest } = prev;
                return rest;
            });
            await Promise.all([reloadLeftPage(currentPageLeft), reloadRightPage(currentPageRight)]);
            refreshSelectAllUniverses();
        }
    }, [selectedLeft, selectedLeftDetails, roleIdNum, updateUserRoleAssignment, reloadLeftPage, reloadRightPage, currentPageLeft, currentPageRight, refreshSelectAllUniverses]);

    const handleAssignMany = useCallback(async () => {
        const usersToAssign = selectedLeft.map(id => selectedLeftDetails[id]).filter((u): u is User => Boolean(u));
        if (usersToAssign.length === 0 || roleIdNum == null) return;

        // Tick All có thể gồm user đã được gán role (vẫn hiển thị ở danh sách trái) -> dedupe userCode để không gửi trùng
        const userCodes = Array.from(new Set(usersToAssign.map(u => u.userCode).filter(Boolean)));

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(userCodes, roleIdNum, true);
        setIsAssigning(false);

        if (ok) {
            setSelectedLeft([]);
            setSelectedLeftDetails({});
            await Promise.all([reloadLeftPage(currentPageLeft), reloadRightPage(currentPageRight)]);
            refreshSelectAllUniverses();
        }
    }, [selectedLeft, selectedLeftDetails, roleIdNum, updateUserRoleAssignment, reloadLeftPage, reloadRightPage, currentPageLeft, currentPageRight, refreshSelectAllUniverses]);

    const handleUnassignOne = useCallback(async () => {
        const firstSelectedUserId = selectedRight[0];
        const userToUnassign = selectedRightDetails[firstSelectedUserId];
        if (!userToUnassign || roleIdNum == null) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment([userToUnassign.userCode], roleIdNum, false);
        setIsAssigning(false);

        if (ok) {
            setSelectedRight(prev => prev.filter(id => id !== userToUnassign.id));
            setSelectedRightDetails(prev => {
                const { [userToUnassign.id]: _removed, ...rest } = prev;
                return rest;
            });
            await Promise.all([reloadLeftPage(currentPageLeft), reloadRightPage(currentPageRight)]);
            refreshSelectAllUniverses();
        }
    }, [selectedRight, selectedRightDetails, roleIdNum, updateUserRoleAssignment, reloadLeftPage, reloadRightPage, currentPageLeft, currentPageRight, refreshSelectAllUniverses]);

    const handleUnassignMany = useCallback(async () => {
        const usersToUnassign = selectedRight.map(id => selectedRightDetails[id]).filter((u): u is User => Boolean(u));
        if (usersToUnassign.length === 0 || roleIdNum == null) return;

        const userCodes = Array.from(new Set(usersToUnassign.map(u => u.userCode).filter(Boolean)));

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(userCodes, roleIdNum, false);
        setIsAssigning(false);

        if (ok) {
            setSelectedRight([]);
            setSelectedRightDetails({});
            await Promise.all([reloadLeftPage(currentPageLeft), reloadRightPage(currentPageRight)]);
            refreshSelectAllUniverses();
        }
    }, [selectedRight, selectedRightDetails, roleIdNum, updateUserRoleAssignment, reloadLeftPage, reloadRightPage, currentPageLeft, currentPageRight, refreshSelectAllUniverses]);

    // fetch bảng trái: search_text/nhóm đổi -> reset về trang 1; page/pageSize đổi -> tải đúng trang đó
    const leftSignatureRef = useRef('');

    useEffect(() => {
        let aborted = false;
        const signature = `${selectedUserGroup}|${leftSearchText}`;

        if (leftSignatureRef.current !== signature) {
            leftSignatureRef.current = signature;
            if (currentPageLeft !== 1) {
                setCurrentPageLeft(1);
                setJumpPageLeft(1);
                return;
            }
        }

        (async () => {
            setLoadingUsers(true);
            try {
                const isDefaultGroup = selectedUserGroup === '' || selectedUserGroup === 'ALL';
                const canUseSeed =
                    isDefaultGroup &&
                    currentPageLeft === 1 &&
                    pageSizeLeft === 10 &&
                    !leftSearchText &&
                    userdata &&
                    userdata.items.length > 0;

                const result: FetchUsersResult = canUseSeed
                    ? {
                        users: uniqById(userdata.items.map(mapAccountToUser)),
                        total: userdata.total_count ?? userdata.items.length,
                        totalPages: userdata.total_pages ?? 1
                    }
                    : isDefaultGroup
                        ? await fetchUsersSearch(currentPageLeft, pageSizeLeft, leftSearchText)
                        : await fetchUsersByRole(toRoleIdNum(String(selectedUserGroup)) ?? 0, currentPageLeft, pageSizeLeft, leftSearchText);

                if (!aborted) {
                    setAllUsers(result.users);
                    setTotalCountLeft(result.total);
                    setTotalPagesLeft(result.totalPages);
                }
            } catch {
                if (!aborted) setAllUsers([]);
            } finally {
                if (!aborted) setLoadingUsers(false);
            }
        })();

        return () => { aborted = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPageLeft, pageSizeLeft, selectedUserGroup, leftSearchText, token, userdata]);

    // fetch bảng phải: search_text/vai trò đổi -> reset về trang 1; page/pageSize đổi -> tải đúng trang đó
    const rightSignatureRef = useRef('');

    useEffect(() => {
        let aborted = false;
        const signature = `${roleIdNum}|${rightSearchText}`;

        if (rightSignatureRef.current !== signature) {
            rightSignatureRef.current = signature;
            if (currentPageRight !== 1) {
                setCurrentPageRight(1);
                setJumpPageRight(1);
                return;
            }
        }

        (async () => {
            if (roleIdNum == null) {
                if (!aborted) {
                    setAssignedUsers([]);
                    setTotalCountRight(0);
                    setTotalPagesRight(0);
                }
                return;
            }

            setLoadingAssignedUsers(true);
            try {
                const result = await fetchUsersByRole(roleIdNum, currentPageRight, pageSizeRight, rightSearchText);
                if (!aborted) {
                    setAssignedUsers(result.users);
                    setTotalCountRight(result.total);
                    setTotalPagesRight(result.totalPages);
                }
            } catch {
                if (!aborted) setAssignedUsers([]);
            } finally {
                if (!aborted) setLoadingAssignedUsers(false);
            }
        })();

        return () => { aborted = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPageRight, pageSizeRight, roleIdNum, rightSearchText, token]);

    // pagination handlers - trái
    const handlePageLeftChange = useCallback((_event: React.ChangeEvent<unknown>, newPage: number) => {
        setCurrentPageLeft(newPage);
        setJumpPageLeft(newPage);
    }, []);

    const handlePageSizeLeftChange = useCallback((event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value);
        setPageSizeLeft(newSize);
        setCurrentPageLeft(1);
        setJumpPageLeft(1);
    }, []);

    const handleJumpPageLeft = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (value > 0 && value <= Math.max(totalPagesLeft, 1)) {
            setJumpPageLeft(value);
            setCurrentPageLeft(value);
        }
    }, [totalPagesLeft]);

    // pagination handlers - phải
    const handlePageRightChange = useCallback((_event: React.ChangeEvent<unknown>, newPage: number) => {
        setCurrentPageRight(newPage);
        setJumpPageRight(newPage);
    }, []);

    const handlePageSizeRightChange = useCallback((event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value);
        setPageSizeRight(newSize);
        setCurrentPageRight(1);
        setJumpPageRight(1);
    }, []);

    const handleJumpPageRight = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (value > 0 && value <= Math.max(totalPagesRight, 1)) {
            setJumpPageRight(value);
            setCurrentPageRight(value);
        }
    }, [totalPagesRight]);

    return {
        // lists (đã là dữ liệu của trang hiện tại - server-side pagination)
        allUsers, assignedUsers, loadingUsers, loadingAssignedUsers,
        // selections
        selectedLeft, selectedRight, handleLeftSelect, handleRightSelect,
        // select all - cùng 1 helper cho cả 2 bảng, chọn toàn bộ dataset/filter hiện tại (không chỉ trang đang xem)
        leftSelectAllChecked: leftSelectAll.checked,
        leftSelectAllIndeterminate: leftSelectAll.indeterminate,
        leftSelectAllLoading: leftSelectAll.selectAllLoading,
        handleLeftSelectAll: leftSelectAll.onToggleAll,
        rightSelectAllChecked: rightSelectAll.checked,
        rightSelectAllIndeterminate: rightSelectAll.indeterminate,
        rightSelectAllLoading: rightSelectAll.selectAllLoading,
        handleRightSelectAll: rightSelectAll.onToggleAll,
        // filters & setters
        filterUserName, setFilterUserName,
        filterFullname, setFilterFullname,
        filterAssignedUserName, setFilterAssignedUserName,
        filterAssignedFullname, setFilterAssignedFullname,
        filteredUsers: allUsers, filteredAssignedUsers: assignedUsers,
        // role pickers
        userGroups, assignableRoles, selectedUserGroup, setSelectedUserGroup,
        selectedAssignedRoleId, setSelectedAssignedRoleId,
        // pagination
        currentPageLeft, pageSizeLeft, totalCountLeft, totalPagesLeft, jumpPageLeft,
        currentPageRight, pageSizeRight, totalCountRight, totalPagesRight, jumpPageRight,
        handlePageLeftChange, handlePageSizeLeftChange, handleJumpPageLeft,
        handlePageRightChange, handlePageSizeRightChange, handleJumpPageRight,
        // actions
        handleAssignOne, handleAssignMany,
        handleUnassignOne, handleUnassignMany,
        isAssigning,
        // toast
        toastOpen, toastMessage, toastSeverity, handleCloseToast,
    };
}
