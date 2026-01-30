"use client";

import { STORECOMMAND } from "@/data/StoreCommand";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { dataService, workflowService } from "@/servers/system-service";
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

// Mobile service IDs constant
const MOBILE_SERVICE_IDS = ["MB", "AM", "WAL"];

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

    // Filter roles by mobile-related service IDs or specific serviceid
    const mobileRoles = useMemo(() => {
        if (serviceid) {
            // Filter by specific serviceid if provided
            return role.items.filter((r) => r.serviceid === serviceid);
        }
        // Default to mobile service IDs
        return role.items.filter((r) => MOBILE_SERVICE_IDS.includes(r.usertype));
    }, [role, serviceid]);

    const userGroups = useMemo(
        () => [{ roleid: "ALL", rolename: "All Mobile Users" }, ...mobileRoles],
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
                console.log("Fetching mobile users with pagination:", {
                    page,
                    size,
                    searchtext,
                });

                const response = await dataService.searchData({
                    sessiontoken: session?.user?.token as string,
                    workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
                    commandname: STORECOMMAND.SIMPLE_SEARCH_MOBILE_USER,
                    searchtext: searchtext,
                    pageSize: size,
                    pageIndex: page,
                });
                console.log(
                    "result fetch: ",
                    response.payload.dataresponse.data.items
                );
                if (response?.status === 200) {
                    // Check for direct response structure first (new format)
                    if (response.payload && "items" in response.payload) {
                        const data = response.payload.items || [];
                        const totalItems = response.payload.items[0]?.total_count || 0;
                        const totalPageCount = response.payload.total_pages || 1;

                        const mappedUsers: UserMobileAccount[] = data.map((u: any) => ({
                            id: u.id || Math.random(), // Generate ID if not provided
                            channel_id: u.channel_id || "MB",
                            user_id: u.user_id,
                            user_name: u.user_name,
                            user_code: u.user_code,
                            login_name: u.login_name,
                            first_name: u.first_name || "",
                            middle_name: u.middle_name || "",
                            last_name: u.last_name || "",
                            role_channel: u.role_channel,
                            user_type: u.user_type || "MB",
                            phone: u.phone,
                            total_count: u.total_count,
                        }));
                        return {
                            users: uniqById(mappedUsers),
                            total: totalItems,
                            totalPages: totalPageCount,
                        };
                    }
                    // Check for nested dataresponse structure (old format)
                    else if (
                        response.payload?.dataresponse &&
                        !(
                            response.payload.dataresponse.errors &&
                            response.payload.dataresponse.errors.length > 0
                        )
                    ) {
                        const data =
                            response.payload.dataresponse.data.items || [];
                        const totalItems =
                            response.payload.dataresponse.data.items[0]
                                ?.total_count || 0;
                        const totalPageCount =
                            response.payload.dataresponse.data.total_pages || 1;

                        const mappedUsers: UserMobileAccount[] = data.map((u: any) => ({
                            id: u.id,
                            channel_id: u.channel_id || u.channelid,
                            user_id: u.user_id || u.userid,
                            user_name: u.user_name || u.username,
                            user_code: u.user_code || u.usercode,
                            login_name: u.login_name || u.loginname,
                            first_name: u.first_name || u.firstname,
                            middle_name: u.middle_name || u.middlename,
                            last_name: u.last_name || u.lastname,
                            role_channel: u.role_channel || u.rolechannel,
                            user_type: u.user_type || u.usertype,
                            phone: u.phone,
                            total_count: u.total_count,
                        }));

                        return {
                            users: uniqById(mappedUsers),
                            total: totalItems,
                            totalPages: totalPageCount,
                        };
                    } else {
                        // Handle error case for nested structure
                        if (
                            response.payload?.dataresponse?.errors &&
                            response.payload.dataresponse.errors.length > 0
                        ) {
                            console.error(
                                "ExecutionID:",
                                response.payload.dataresponse.errors[0].execute_id +
                                " - [MobileUser] - " +
                                response.payload.dataresponse.errors[0].info
                            );
                        }
                        return { users: [], total: 0, totalPages: 0 };
                    }
                } else {
                    console.error("API returned non-200 status:", response?.status);
                    return { users: [], total: 0, totalPages: 0 };
                }
            } catch (err) {
                console.error("Error fetching mobile users with pagination:", err);
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
            console.log("Fetching mobile users by role with pagination:", {
                page,
                size,
                searchtext,
                roleId,
            });

            if (roleId === 0 || roleId === null) {
                return { users: [], total: 0, totalPages: 0 };
            }

            const response = await dataService.searchData({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
                commandname: STORECOMMAND.SIMPLE_SEARCH_MOBILE_USER_BY_ROLE,
                searchtext: searchtext,
                pageSize: size,
                pageIndex: page,
                parameters: { roleid: roleId },
            });
            console.log(
                "result fetch right: ",
                response.payload.dataresponse.data.items
            );
            if (response?.status === 200) {
                // Check for direct response structure first (new format)
                if (response.payload && "items" in response.payload) {
                    const data = response.payload.items || [];
                    const totalItems = response.payload.items[0]?.total_count || 0;
                    const totalPageCount = response.payload.total_pages || 1;

                    const mappedUsers: UserMobileAccount[] = data.map((u: any) => ({
                        id: u.id || Math.random(), // Generate ID if not provided
                        channel_id: u.channel_id || "MB",
                        user_id: u.user_id,
                        user_name: u.user_name,
                        user_code: u.user_code,
                        login_name: u.login_name,
                        first_name: u.first_name || "",
                        middle_name: u.middle_name || "",
                        last_name: u.last_name || "",
                        role_channel: u.role_channel,
                        user_type: u.user_type || "MB",
                        phone: u.phone,
                        total_count: u.total_count,
                    }));
                    return {
                        users: uniqById(mappedUsers),
                        total: totalItems,
                        totalPages: totalPageCount,
                    };
                }
                // Check for nested dataresponse structure (old format)
                else if (
                    response.payload?.dataresponse &&
                    !(
                        response.payload.dataresponse.error &&
                        response.payload.dataresponses.error.length > 0
                    )
                ) {
                    const data = response.payload.dataresponse.data.items || [];
                    const totalItems =
                        response.payload.dataresponse.data.items[0]?.total_count ||
                        0;
                    const totalPageCount =
                        response.payload.dataresponse.data.total_pages || 1;

                    const mappedUsers: UserMobileAccount[] = data.map((u: any) => ({
                        id: u.id,
                        channel_id: u.channel_id || u.channelid,
                        user_id: u.user_id || u.userid,
                        user_name: u.user_name || u.username,
                        user_code: u.user_code || u.usercode,
                        login_name: u.login_name || u.loginname,
                        first_name: u.first_name || u.firstname,
                        middle_name: u.middle_name || u.middlename,
                        last_name: u.last_name || u.lastname,
                        role_channel: u.role_channel || u.rolechannel,
                        user_type: u.user_type || u.usertype,
                        phone: u.phone,
                        total_count: u.total_count,
                    }));

                    return {
                        users: uniqById(mappedUsers),
                        total: totalItems,
                        totalPages: totalPageCount,
                    };
                } else {
                    // Handle error case for nested structure
                    if (
                        response.payload?.dataresponse?.errors &&
                        response.payload.dataresponse.errors.length > 0
                    ) {
                        console.error(
                            "ExecutionID:",
                            response.payload.dataresponse.errors[0].execute_id +
                            " - [MobileUserByRole] - " +
                            response.payload.dataresponse.errors[0].info
                        );
                    }
                    return { users: [], total: 0, totalPages: 0 };
                }
            } else {
                console.error("API returned non-200 status:", response?.status);
                return { users: [], total: 0, totalPages: 0 };
            }
        } catch (err) {
            console.error("Error fetching mobile users by role with pagination:", err);
            return { users: [], total: 0, totalPages: 0 };
        }
    };

    useEffect(() => {
        const filterLeftTableData = async () => {
            console.log("Call filterLeftTableData: ", pageSizeLeft);
            const { users, total, totalPages } = await fetchMobileUsers(
                1,
                pageSizeLeft,
                filterUserName || filterFullname
            );
            console.log("Filtered users: ", users);
            setAllUsers(users);
            setTotalCountLeft(total);
            setTotalPagesLeft(totalPages);
        };

        filterLeftTableData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterUserName, filterFullname]);

    useEffect(() => {
        const filterRightTableData = async () => {
            console.log("Call filterRightTableData: ", pageSizeRight);
            const { users, total, totalPages } = await fetchMobileUsersByRole(
                1,
                pageSizeRight,
                filterAssignedUserName || filterAssignedFullname,
                roleIdNum as number
            );
            console.log("Filtered assign users: ", users);
            setAssignedUsers(users);
            setTotalCountRight(total);
            setTotalPagesRight(totalPages);
        };

        filterRightTableData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterAssignedUserName, filterAssignedFullname]);

    useEffect(() => {
        const changePaginationLeft = async () => {
            console.log("Call changePagination");
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
            console.log("Call changePagination Right");
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
                console.error("Failed to assignment mobile user:", response);
                return false;
            } catch (err) {
                console.error("Error updating mobile assignment:", err);
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
            } catch (err) {
                console.error("Error fetching users:", err);
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

            } catch (err) {
                console.error(
                    "[Assigned Users] Error fetching assigned mobile users:",
                    err
                );
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
        console.log("assignedUsers in memo: ", assignedUsers);
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

