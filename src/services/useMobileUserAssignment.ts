"use client";

import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { workflowService } from "@/servers/system-service";
import { UserMobileAccount } from "@shared/types/bankType";
import { PageData, Role } from "@shared/types/systemTypes";
import { SelectChangeEvent } from "@mui/material";
import { Session } from "next-auth";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Dictionary = Record<string, any>;

type Params = {
    session: Session | null;
    dictionary: Dictionary;
    role: PageData<Role>;
    userdata: PageData<UserMobileAccount>;
    serviceid?: string; // Add serviceid parameter for filtering roles
};

// helpers
const uniqById = <T extends { id: number }>(arr: T[]) => {
    const seen = new Set<number>();
    return arr.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};

const toRoleIdNum = (v: number | "" | string): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
    return null; // '', undefined => not selected
};

const firstNumberOrUndef = (s?: string) => {
    if (!s) return undefined;
    const m = s.match(/\d+/);
    return m ? Number(m[0]) : undefined;
};

// Fields đôi khi trả về theo cả snake_case và camelCase tuỳ workflow, nên phải dò nhiều key.
const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== "object") return undefined;

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key];
    }

    return undefined;
};

const toNumber = (value: any, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

// id phải là number ổn định qua các lần fetch; ưu tiên id thật, nếu không có thì hash user_code/user_id
// (không dùng Math.random() vì sẽ đổi mỗi lần render, phá vỡ so sánh/chọn theo id).
const toStableId = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    const str = String(value ?? "").trim();
    if (/^\d+$/.test(str)) return Number(str);

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
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

    return error?.execution_id ?? error?.executionid ?? dataresponse?.execution_id ?? dataresponse?.executionid ?? "";
};

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.items)) return root.items;
    if (Array.isArray(root?.data)) return root.data;

    return [];
};

const mapMobileUser = (item: any): UserMobileAccount => {
    const user_id = getField(item, ["user_id", "userId"]) ?? "";
    const user_code = getField(item, ["user_code", "userCode"]) ?? "";
    const rawId = getField(item, ["id"]);

    return {
        id: rawId !== undefined ? toStableId(rawId) : toStableId(user_code || user_id),
        channel_id: String(getField(item, ["channel_id", "channelId"]) ?? "MB"),
        user_id: String(user_id),
        user_name: String(getField(item, ["user_name", "userName"]) ?? ""),
        user_code: String(user_code),
        login_name: String(getField(item, ["login_name", "loginName"]) ?? ""),
        first_name: String(getField(item, ["first_name", "firstName"]) ?? ""),
        middle_name: String(getField(item, ["middle_name", "middleName"]) ?? ""),
        last_name: String(getField(item, ["last_name", "lastName"]) ?? ""),
        role_channel: String(getField(item, ["role_channel", "roleChannel"]) ?? ""),
        user_type: String(getField(item, ["user_type", "userType"]) ?? "MB"),
        phone: getField(item, ["phone"]) ?? undefined,
        total_count: toNumber(getField(item, ["total_count", "totalCount"]), 0)
    };
};

// Helper function to check if user is mobile user
const isMobileUser = (user: UserMobileAccount): boolean => {
    // Check if channelid contains mobile indicators or usertype indicates mobile
    const channelIndicators = ["mobile", "app", "mb", "mobileapp"];
    const typeIndicators = ["mobile", "app", "mobileuser"];

    const channelCheck = channelIndicators.some((indicator) =>
        user.channel_id?.toLowerCase().includes(indicator)
    );

    const typeCheck = typeIndicators.some((indicator) =>
        user.user_type?.toLowerCase().includes(indicator)
    );

    // Also check if phone number exists (mobile users typically have phone numbers)
    const hasPhone = Boolean(user.phone?.trim());

    return channelCheck || typeCheck || hasPhone;
};

export function useMobileUserAssignment({
    session,
    dictionary,
    role,
    userdata,
    serviceid,
}: Params) {
    // toast
    const [toastSeverity, setToastSeverity] = useState<"success" | "error">(
        "success"
    );
    const [toastMessage, setToastMessage] = useState("");
    const [toastOpen, setToastOpen] = useState(false);

    // lists & selections
    const [assignedUsers, setAssignedUsers] = useState<UserMobileAccount[]>([]);
    const [allUsers, setAllUsers] = useState<UserMobileAccount[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<number[]>([]);
    const [selectedRight, setSelectedRight] = useState<number[]>([]);

    // filters
    const [filterUserName, setFilterUserName] = useState("");
    const [filterFullname, setFilterFullname] = useState("");
    const [filterAssignedUserName, setFilterAssignedUserName] = useState("");
    const [filterAssignedFullname, setFilterAssignedFullname] = useState("");

    // pickers
    const [selectedUserGroup, setSelectedUserGroup] = useState<number | string>(
        "ALL"
    );
    const [selectedAssignedRoleId, setSelectedAssignedRoleId] = useState<
        number | ""
    >("");

    // others
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    // pagination
    const [currentPageLeft, setCurrentPageLeft] = useState(1);
    const [pageSizeLeft, setPageSizeLeft] = useState(10);
    const [totalCountLeft, setTotalCountLeft] = useState<number>(
        userdata.items[0]?.total_count || 0
    );
    const [totalPagesLeft, setTotalPagesLeft] = useState(0);

    const [jumpPageLeft, setJumpPageLeft] = useState<number>(
        currentPageLeft || 1
    );
    const [currentPageRight, setCurrentPageRight] = useState(1);
    const [pageSizeRight, setPageSizeRight] = useState(10);
    const [totalCountRight, setTotalCountRight] = useState<number>(
        assignedUsers[0]?.total_count || 0
    );
    const [totalPagesRight, setTotalPagesRight] = useState(0);

    const [jumpPageRight, setJumpPageRight] = useState<number>(
        currentPageRight || 1
    );

    // User Mobile Assignment chỉ được chọn role thuộc Service MB (role.serviceid, map từ service_id/serviceId).
    const mobileRoles = useMemo(() => {
        const targetServiceId = serviceid || "MB";
        return role.items.filter((r) => r.serviceid === targetServiceId);
    }, [role, serviceid]);

    const userGroups = useMemo(
        () => [{ roleid: "ALL", rolename: "All Users" }, ...mobileRoles],
        [mobileRoles]
    );
    const token = session?.user?.token as string | undefined;
    const roleIdNum = useMemo<number | null>(
        () => toRoleIdNum(selectedAssignedRoleId),
        [selectedAssignedRoleId]
    );

    // toast helpers
    const showToast = useCallback(
        (severity: "success" | "error", msg: string) => {
            setToastSeverity(severity);
            setToastMessage(msg);
            setToastOpen(true);
        },
        []
    );

    const handleCloseToast = useCallback(
        (_e?: React.SyntheticEvent | Event, reason?: string) => {
            if (reason === "clickaway") return;
            setToastOpen(false);
        },
        []
    );

    // Sync selectedUserGroup with selectedAssignedRoleId for assigned users
    useEffect(() => {
        if (selectedUserGroup === "ALL" || selectedUserGroup === "") {
            // When "All Mobile Users" is selected, clear assigned role
            setSelectedAssignedRoleId("");
        } else if (typeof selectedUserGroup === "number") {
            // When a specific role is selected, sync it to assigned role
            setSelectedAssignedRoleId(selectedUserGroup);
        } else if (
            typeof selectedUserGroup === "string" &&
            /^\d+$/.test(selectedUserGroup)
        ) {
            // When a string role ID is selected, convert to number
            const roleId = Number(selectedUserGroup);
            setSelectedAssignedRoleId(roleId);
        }
    }, [selectedUserGroup]);

    // API: fetch mobile users with pagination
    const fetchMobileUsers = useCallback(
        async (
            page: number = 1,
            size: number = 10,
            searchtext: string = ""
        ): Promise<{
            users: UserMobileAccount[];
            total: number;
            totalPages: number;
        }> => {
            try {
                const response = await workflowService.runFODynamic({
                    sessiontoken: session?.user?.token as string,
                    workflowid: WORKFLOWCODE.WF_BO_SIMPLE_SEARCH_USER,
                    input: {
                        page_size: size,
                        page_index: Math.max(page - 1, 0),
                        search_text: searchtext,
                        channel_code: "MB",
                    },
                });

                if (response?.status !== 200) {
                    return { users: [], total: 0, totalPages: 0 };
                }

                const errors = getErrors(response);
                if (Array.isArray(errors) && errors.length > 0) {
                    return { users: [], total: 0, totalPages: 0 };
                }

                const root = getResponseRoot(response);
                const total = toNumber(getField(root, ["total_count", "totalCount"]), 0);
                const totalPages = toNumber(getField(root, ["total_pages", "totalPages"]), 0);
                const mappedUsers = uniqById(pickItems(root).map(mapMobileUser));

                return { users: mappedUsers, total, totalPages };
            } catch {
                return { users: [], total: 0, totalPages: 0 };
            }
        },
        [session]
    );

    // API: fetch mobile users with pagination
    const fetchMobileUsersByRole = async (
        page: number = 1,
        size: number = 10,
        searchtext: string = "",
        roleId: number = 0
    ): Promise<{
        users: UserMobileAccount[];
        total: number;
        totalPages: number;
    }> => {
        try {
            if (roleId === 0 || roleId === null) {
                return { users: [], total: 0, totalPages: 0 };
            }

            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.WF_BO_SEARCH_MOBILE_USER_BY_ROLES,
                input: {
                    page_size: size,
                    page_index: Math.max(page - 1, 0),
                    search_text: searchtext,
                    role_id: roleId,
                },
            });

            if (response?.status !== 200) {
                return { users: [], total: 0, totalPages: 0 };
            }

            const errors = getErrors(response);
            if (Array.isArray(errors) && errors.length > 0) {
                return { users: [], total: 0, totalPages: 0 };
            }

            const root = getResponseRoot(response);
            const total = toNumber(getField(root, ["total_count", "totalCount"]), 0);
            const totalPages = toNumber(getField(root, ["total_pages", "totalPages"]), 0);
            const mappedUsers = uniqById(pickItems(root).map(mapMobileUser));

            return { users: mappedUsers, total, totalPages };
        } catch {
            return { users: [], total: 0, totalPages: 0 };
        }
    };

    useEffect(() => {
        const filterLeftTableData = async () => {
            const { users, total, totalPages } = await fetchMobileUsers(
                1,
                pageSizeLeft,
                filterUserName || filterFullname
            );
            setAllUsers(users);
            setTotalCountLeft(total);
            setTotalPagesLeft(totalPages);
        };

        filterLeftTableData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterUserName, filterFullname]);

    useEffect(() => {
        const filterRightTableData = async () => {
            const { users, total, totalPages } = await fetchMobileUsersByRole(
                1,
                pageSizeRight,
                filterAssignedUserName || filterAssignedFullname,
                roleIdNum as number
            );
            setAssignedUsers(users);
            setTotalCountRight(total);
            setTotalPagesRight(totalPages);
        };

        filterRightTableData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterAssignedUserName, filterAssignedFullname]);

    useEffect(() => {
        const changePaginationLeft = async () => {
            const { users, total, totalPages } = await fetchMobileUsers(
                currentPageLeft,
                pageSizeLeft,
                filterUserName || filterFullname
            );

            setAllUsers(users);
            setTotalCountLeft(total);
            setTotalPagesLeft(totalPages);
        };
        changePaginationLeft();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPageLeft, pageSizeLeft]);

    useEffect(() => {
        const changePaginationRight = async () => {
            const { users, total, totalPages } = await fetchMobileUsersByRole(
                currentPageRight,
                pageSizeRight,
                filterAssignedUserName || filterAssignedFullname,
                roleIdNum as number
            );

            setAssignedUsers(users);
            setTotalCountRight(total);
            setTotalPagesRight(totalPages);
        };
        changePaginationRight();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPageRight, pageSizeRight]);

    // API: assign/unassign
    const updateUserRoleAssignment = useCallback(
        async (
            userIds: string[],
            roleId: number,
            isAssign: boolean
        ): Promise<boolean> => {
            try {
                const response = await workflowService.runFODynamic({
                    sessiontoken: token as string,
                    workflowid: WORKFLOWCODE.BO_UPDATE_USER_ROLE_ASSIGNMENT,
                    input: {
                        role_id: roleId,
                        list_of_user: userIds,
                        is_assign: isAssign,
                    },
                });

                if (response.status === 200) {
                    const hasError = response.payload.dataresponse.errors.length > 0;
                    if (hasError) {
                        showToast(
                            "error",
                            response.payload.error?.[0]?.info ||
                            dictionary["common"].updateerror
                        );
                        return false;
                    }
                    showToast("success", dictionary["common"].updaterolesuccess);
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        },
        [token, dictionary, showToast]
    );

    // pagination handlers
    const handlePageLeftChange = async (
        event: React.ChangeEvent<unknown>,
        newPage: number
    ) => {
        setCurrentPageLeft(newPage);
        setJumpPageLeft(newPage);
    };

    const handlePageSizeLeftChange = async (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value);
        setPageSizeLeft(newSize);
        setCurrentPageLeft(1); // Reset to first page
        setJumpPageLeft(1);
    };

    const handleJumpPageLeft = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);
        if (value > 0 && value <= Math.ceil(totalCountLeft / pageSizeLeft)) {
            setJumpPageLeft(value);
            setCurrentPageLeft(value);
        }
    };

    const handlePageRightChange = async (
        event: React.ChangeEvent<unknown>,
        newPage: number
    ) => {
        setCurrentPageRight(newPage);
        setJumpPageRight(newPage);
    };

    const handlePageSizeRightChange = async (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value);
        setPageSizeRight(newSize);
        setCurrentPageRight(1); // Reset to first page
        setJumpPageRight(1);
    };

    const handleJumpPageRight = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);
        if (value > 0 && value <= Math.ceil(totalCountRight / pageSizeRight)) {
            setJumpPageRight(value);
            setCurrentPageRight(value);
        }
    };

    // selections
    const handleLeftSelect = useCallback((id: number) => {
        setSelectedLeft((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);
    const handleRightSelect = useCallback((id: number) => {
        setSelectedRight((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    // assign/unassign handlers (use roleIdNum + uniq)
    const handleAssignOne = useCallback(async () => {
        const firstSelectedUserId = selectedLeft[0];
        const userToAssign = allUsers.find((u) => u.id === firstSelectedUserId);
        if (!userToAssign || roleIdNum == null) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(
            [userToAssign.user_code],
            roleIdNum,
            true
        );
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers((prev) =>
                uniqById([...prev, { ...userToAssign, roleid: roleIdNum }])
            );
            setAllUsers((prev) => prev.filter((u) => u.id !== userToAssign.id));
            setSelectedLeft((prev) => prev.filter((id) => id !== userToAssign.id));
        }
    }, [selectedLeft, allUsers, roleIdNum, updateUserRoleAssignment]);

    const handleAssignMany = useCallback(async () => {
        const usersToAssign = (allUsers ?? []).filter((u) =>
            selectedLeft.includes(u.id)
        );
        if (usersToAssign.length === 0 || roleIdNum == null) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(
            usersToAssign.map((u) => u.user_code),
            roleIdNum,
            true
        );
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers((prev) =>
                uniqById([
                    ...prev,
                    ...usersToAssign.map((u) => ({ ...u, roleid: roleIdNum })),
                ])
            );
            setAllUsers((prev) =>
                prev.filter((u) => !usersToAssign.some((a) => a.id === u.id))
            );
            setSelectedLeft([]);
        }
    }, [allUsers, selectedLeft, roleIdNum, updateUserRoleAssignment]);

    const handleUnassignOne = useCallback(async () => {
        const firstSelectedUserId = selectedRight[0];
        if (!firstSelectedUserId || roleIdNum == null) return;

        const userToUnassign = assignedUsers.find(
            (u) => u.id === firstSelectedUserId
        );
        if (!userToUnassign) return;

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(
            [userToUnassign.user_code],
            roleIdNum,
            false
        );
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers((prev) =>
                prev.filter((u) => u.id !== userToUnassign.id)
            );
            setAllUsers((prev) => uniqById([...prev, userToUnassign]));
            setSelectedRight((prev) => prev.filter((id) => id !== userToUnassign.id));
        }
    }, [selectedRight, roleIdNum, assignedUsers, updateUserRoleAssignment]);

    const handleUnassignMany = useCallback(async () => {
        if (selectedRight.length === 0 || roleIdNum == null) return;

        const usersToUnassign = assignedUsers.filter((u) =>
            selectedRight.includes(u.id)
        );
        const userCodes = usersToUnassign.map((u) => u.user_code);

        setIsAssigning(true);
        const ok = await updateUserRoleAssignment(userCodes, roleIdNum, false);
        setIsAssigning(false);

        if (ok) {
            setAssignedUsers((prev) =>
                prev.filter((u) => !selectedRight.includes(u.id))
            );
            setAllUsers((prev) => uniqById([...prev, ...usersToUnassign]));
            setSelectedRight([]);
        }
    }, [selectedRight, roleIdNum, assignedUsers, updateUserRoleAssignment]);

    // fetch left list (ALL => use userdata prop, role-specific => fetch from API)
    useEffect(() => {
        let aborted = false;
        (async () => {
            setLoadingUsers(true);
            try {
                if (selectedUserGroup === "" || selectedUserGroup === "ALL") {
                    if (userdata && userdata.items.length > 0) {
                        const initialMapped: UserMobileAccount[] = userdata.items.map(
                            (u) => ({
                                id: u.id,
                                channel_id: u.channel_id,
                                user_id: u.user_id || u.id?.toString(),
                                user_name: u.user_name,
                                user_code: u.user_code,
                                login_name: u.user_name,
                                first_name: u.first_name,
                                middle_name: u.middle_name,
                                last_name: u.last_name,
                                role_channel: u.role_channel,
                                user_type: u.user_type,
                                phone: u.phone,
                                total_count: u.total_count,
                            })
                        );

                        if (!aborted) {
                            setAllUsers(initialMapped);
                            setTotalCountLeft(
                                userdata.items[0]?.total_count || initialMapped.length
                            );
                            setTotalPagesLeft(userdata.total_pages);
                        }
                    } else {
                        // Fallback to API if userdata is empty (shouldn't happen but safety net)
                        const { users, total, totalPages } = await fetchMobileUsers(
                            currentPageLeft,
                            pageSizeLeft
                        );
                        if (!aborted) {
                            setAllUsers(users);
                            setTotalCountLeft(total);
                            setTotalPagesLeft(totalPages);
                        }
                    }
                } else {
                    const { users, total, totalPages } = await fetchMobileUsers(
                        currentPageLeft,
                        pageSizeLeft
                    );

                    if (!aborted) {
                        setAllUsers(users);
                        setTotalCountLeft(total);
                        setTotalPagesLeft(totalPages);
                    }
                }
            } catch {
                if (!aborted) {
                    setAllUsers([]);
                    setTotalCountLeft(0);
                    setTotalPagesLeft(0);
                }
            } finally {
                if (!aborted) setLoadingUsers(false);
            }
        })();
        return () => {
            aborted = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUserGroup, token, userdata, fetchMobileUsers]);

    // fetch right list (by roleIdNum) - filter for mobile users
    useEffect(() => {
        let aborted = false;
        (async () => {
            if (roleIdNum == null) {
                if (!aborted) setAssignedUsers([]);
                return;
            }

            try {
                const data = await fetchMobileUsersByRole(
                    currentPageRight,
                    pageSizeRight,
                    filterAssignedUserName || filterAssignedFullname,
                    roleIdNum
                );

                setAssignedUsers(data.users);
                setTotalCountRight(data.users[0]?.total_count || data.total);
                setTotalPagesRight(data.totalPages);

            } catch {
                if (!aborted) setAssignedUsers([]);
            }
        })();
        return () => {
            aborted = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleIdNum, token]);

    // filter left list - show all mobile users with search filters only (no role filtering)
    const filteredUsers = useMemo(() => {
        if (allUsers.length === 0) {
            return [];
        } else if (allUsers.length == 1 && allUsers[0].id === undefined) {
            return [];
        }

        return allUsers;
    }, [allUsers]);

    // filter right list - assigned users (server already filtered by role, just apply search filters)
    const filteredAssignedUsers = useMemo(() => {
        if (assignedUsers.length === 0) {
            return [];
        } else if (assignedUsers.length == 1 && assignedUsers[0].id === undefined) {
            return [];
        }

        return assignedUsers;
    }, [assignedUsers]);

    return {
        // lists
        allUsers,
        assignedUsers,
        loadingUsers,
        // selections
        selectedLeft,
        selectedRight,
        handleLeftSelect,
        handleRightSelect,
        // filters & setters
        filterUserName,
        setFilterUserName,
        filterFullname,
        setFilterFullname,
        filterAssignedUserName,
        setFilterAssignedUserName,
        filterAssignedFullname,
        setFilterAssignedFullname,
        filteredUsers,
        filteredAssignedUsers,
        // role pickers
        mobileRoles,
        userGroups,
        selectedUserGroup,
        setSelectedUserGroup,
        selectedAssignedRoleId,
        setSelectedAssignedRoleId,
        // pagination
        currentPageLeft,
        pageSizeLeft,
        totalCountLeft,
        totalPagesLeft,
        jumpPageLeft,
        currentPageRight,
        pageSizeRight,
        totalCountRight,
        totalPagesRight,
        jumpPageRight,
        // pagination handlers
        handlePageLeftChange,
        handlePageSizeLeftChange,
        handleJumpPageLeft,
        handlePageRightChange,
        handlePageSizeRightChange,
        handleJumpPageRight,
        // actions
        handleAssignOne,
        handleAssignMany,
        handleUnassignOne,
        handleUnassignMany,
        isAssigning,
        // toast
        toastOpen,
        toastMessage,
        toastSeverity,
        handleCloseToast,
    };
}

