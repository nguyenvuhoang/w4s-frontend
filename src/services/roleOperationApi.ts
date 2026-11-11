import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { Locale } from '@/configs/i18n';
import { normalizeMenuHierarchy, toPermissionBoolean } from '@/shared/permissions/permissionUtils';
import type { RawMenuCommandNode } from '@/shared/permissions/permissionTypes';
import { MenuItem, Operation, OperationHeader } from '@shared/types/systemTypes';

// Cac ham thuan tuy, khong phu thuoc React, bao boc dung 3 workflow ma man Invoke-Approve o
// roles-profile (xem src/services/useInvokeApprove.ts) dang dung: WF_BO_LOAD_MENU, WF_BO_LOAD_OPERATION,
// WF_BO_UPDATE_RIGHT. Duoc dung chung boi useInvokeApprove (roles-profile) va useRoleCreatePermissions
// (man tao moi Role) de tranh 2 implementation doc lap cho cung 1 workflow.

export const EMPTY_ROLE_OPERATION: Operation = { operation_header: [], operation_body: [] };

export interface RoleOperationColumn {
    cmdid: string;
    caption: string;
    /** Backend-localized name when present; render label -> caption. */
    label?: string;
}

// WF_BO_LOAD_OPERATION is the source of truth for operation text (already localized by request
// `lang`). cmdid is retained solely for matching an operation header to operation_body rows.
export const buildOperationColumns = (
    operationHeaders: OperationHeader[] | undefined,
    fallbackCaption: string
): RoleOperationColumn[] => (
    operationHeaders?.map(header => ({
        cmdid: header.cmdid,
        label: typeof header.label === 'string' && header.label.trim() ? header.label.trim() : undefined,
        caption: typeof header.caption === 'string' && header.caption.trim()
            ? header.caption.trim()
            : fallbackCaption
    })) ?? []
);

export interface RoleRightPayloadItem {
    RoleId: number;
    CommandId: string;
    CommandIdDetail: string;
    Invoke: boolean;
    Approve: boolean;
    ChannelId: string;
}

// WF_BO_LOAD_MENU { channel_id } -> cay menu day du (chua loc parent/child).
// `language` phai duoc truyen theo locale route hien tai: backend localize field `label` theo
// header/request `lang`, frontend chi render thang `label` (khong tu resolve locale lan 2).
export const fetchRoleMenuTree = async (sessiontoken: string, channelId: string = 'BO', language?: Locale, throwOnError = false): Promise<MenuItem[]> => {
    try {

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: WORKFLOWCODE.WF_BO_LOAD_MENU,
            input: { channel: channelId },
            language
        });

        // TAM THOI DEBUG - xoa sau khi xac dinh xong nguyen nhan menu rong.

        if (response.status === 200 && response.payload?.dataresponse?.data) {
            const items = (response.payload.dataresponse.data.data as MenuItem[]) ?? [];


            return items;
        }

        const message = response?.payload?.dataresponse?.errors?.[0]?.info
            || 'Unable to load menu permissions.'

        if (throwOnError) throw new Error(message)


    } catch (error) {
        if (throwOnError) throw error

    }

    return [];
};

const getNodeCommandType = (item: any): string => {
    const type = item?.command_type ?? item?.commandType;

    return type === undefined || type === null || type === '' ? 'M' : String(type).toUpperCase();
};

// Absent group_menu_visible defaults to visible — same rule buildPermissionRegistry/
// filterMenuForSidebar apply for the app's own sidebar (see permissionUtils.ts).
const isMenuVisible = (item: any): boolean => {
    const raw = item?.group_menu_visible ?? item?.groupMenuVisible;

    return raw === undefined || raw === null ? true : toPermissionBoolean(raw);
};

// WF_BO_LOAD_MENU co the tra ve dang cay long nhau san (children co san) hoac dang list phang lien
// ket qua parent_id — normalizeMenuHierarchy (dung chung voi sidebar/permission engine cua app, xem
// src/shared/permissions/permissionUtils.ts) xu ly ca 2 dang, dong thoi tu chuan hoa parent_id
// (undefined/null/''/'0' deu la goc). Truoc day tu doc thang item.children va so sanh
// item.parent_id === '0'/item.group_menu_visible === '1' bang chuoi tuyet doi nen khi backend tra
// kieu du lieu khac (parent_id la number, group_menu_visible la 'T'/'true'/true...) toan bo menu
// goc bi loai, UI trong trang du response co day du data.
//
// Menu goc duoc phep hien thi trong cong cu quan ly Invoke/Approve: chi la node command_type='M' va
// duoc phep hien thi (group_menu_visible). KHONG dung filterMenuForSidebar o day — ham do con doi
// hoi invoke=true (chi hien menu ma NGUOI DUNG HIEN TAI da duoc cap quyen), trong khi muc dich man
// Invoke/Approve la CAU HINH quyen cho role khac (ke ca role moi tao, invoke=false cho tat ca) nen
// phai thay duoc toan bo menu co the quan ly, bat ke role dang cau hinh da co quyen hay chua.
export const filterVisibleParentMenus = (items: MenuItem[]): MenuItem[] => {
    const tree = normalizeMenuHierarchy(items as unknown as RawMenuCommandNode[]) as unknown as MenuItem[];


    // WF_BO_LOAD_MENU can put command/action nodes (command_type C) in `children`.
    // Invoke/Approve screens use that workflow only to build the navigation tree, so
    // keep MENU nodes at every depth. Operations are loaded for the selected menu via
    // WF_BO_LOAD_OPERATION and must not be rendered as menu entries.
    const keepMenuNodes = (nodes: MenuItem[]): MenuItem[] => (
        nodes
            .filter(item => getNodeCommandType(item) === 'M')
            .map(item => ({ ...item, children: keepMenuNodes(item.children ?? []) }))
    );

    // Preserve the existing Role Profile convention: visibility controls the root
    // group, while all child MENU entries in that group remain selectable.
    const filtered = keepMenuNodes(tree.filter(item => isMenuVisible(item)));


    return filtered;
};

// WF_BO_LOAD_OPERATION { command_id } -> danh sach cot (operation_header) + du lieu Invoke/Approve
// hien tai theo tung role (operation_body) cua mot menu.
export const fetchRoleOperations = async (sessiontoken: string, commandId: string, language?: Locale): Promise<Operation> => {
    if (!commandId) return EMPTY_ROLE_OPERATION;

    try {
        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: WORKFLOWCODE.WF_BO_LOAD_OPERATION,
            input: { command_id: commandId },
            language
        });

        if (response.status === 200 && response.payload?.dataresponse?.data) {
            return (response.payload.dataresponse.data as unknown as Operation) ?? EMPTY_ROLE_OPERATION;
        }
    } catch {}

    return EMPTY_ROLE_OPERATION;
};

// WF_BO_UPDATE_RIGHT { list_user_right }: dung chung cho ca cap nhat tuc thi (roles-profile,
// moi checkbox 1 item) lan gan quyen hang loat khi tao Role moi (nhieu item mot lan).
export const submitRoleRights = async ({
    sessiontoken,
    language,
    items
}: {
    sessiontoken: string;
    language?: Locale;
    items: RoleRightPayloadItem[];
}) => {
    return workflowService.runFODynamic({
        sessiontoken,
        workflowid: WORKFLOWCODE.WF_BO_UPDATE_RIGHT,
        input: { list_user_right: items },
        language
    });
};
