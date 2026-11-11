import { auth } from '@/auth';
import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { UserAccount, UserMobileAccount } from '@shared/types/bankType';
import { PageData, Role } from '@shared/types/systemTypes';
import RoleProfileGeneric from '@/views/pages/role-profile';
import Spinner from '@components/spinners';
import { getDictionary } from '@utils/getDictionary';
import { getServerBackendToken } from '@/server/auth/getServerBackendToken';
import logger from '@lib/logger'

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

const toBoolean = (value: any) =>
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y';

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

// Gom logic parse PageData<T> dùng chung cho cả 3 workflow (data.items / total_count / total_pages...)
const mapPageData = <T,>(
    response: any,
    mapItem: (item: any) => T,
    requestPageIndex: number,
    requestPageSize: number,
    label: string
): PageData<T> | null => {
    const errors = getErrors(response);

    if (response?.status !== 200 || (Array.isArray(errors) && errors.length > 0)) {
        logger.log('ExecutionID:', `${getExecutionId(response)} - [${label}]`);

        return null;
    }

    const root = getResponseRoot(response);
    const totalCount = toNumber(getField(root, ['total_count', 'totalCount']), 0);
    const pageSize = toNumber(getField(root, ['page_size', 'pageSize']), requestPageSize);
    const totalPages = toNumber(
        getField(root, ['total_pages', 'totalPages']),
        pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0
    );

    return {
        items: pickItems(root).map(mapItem),
        total_count: totalCount,
        total_pages: totalPages,
        has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
        has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage'])),
        page_index: toNumber(getField(root, ['page_index', 'pageIndex']), requestPageIndex),
        page_size: pageSize
    };
};

const mapRole = (item: any): Role => ({
    id: toNumber(getField(item, ['id']), 0),
    roleid: toNumber(getField(item, ['role_id', 'roleId', 'roleid']), 0),
    rolename: String(getField(item, ['role_name', 'roleName', 'rolename']) ?? ''),
    roledescription: String(getField(item, ['role_description', 'roleDescription', 'roledescription']) ?? ''),
    usertype: String(getField(item, ['user_type', 'userType', 'usertype']) ?? ''),
    contractno: getField(item, ['contract_no', 'contractNo', 'contractno']) ?? null,
    usercreated: String(getField(item, ['user_created', 'userCreated', 'usercreated']) ?? ''),
    datecreated: String(getField(item, ['date_created', 'dateCreated', 'datecreated']) ?? ''),
    usermodified: getField(item, ['user_modified', 'userModified', 'usermodified']) ?? null,
    datemodified: getField(item, ['date_modified', 'dateModified', 'datemodified']) ?? null,
    serviceid: String(getField(item, ['service_id', 'serviceId', 'serviceid']) ?? ''),
    roletype: String(getField(item, ['role_type', 'roleType', 'roletype']) ?? ''),
    status: String(getField(item, ['status']) ?? ''),
    isshow: String(getField(item, ['is_show', 'isShow', 'isshow']) ?? ''),
    order: toNumber(getField(item, ['sort_order', 'sortOrder', 'order']), 0),
    totalcount: toNumber(getField(item, ['total_count', 'totalCount', 'totalcount']), 0)
});

const mapUserAccount = (item: any): UserAccount => ({
    id: toNumber(getField(item, ['id']), 0),
    channelid: String(getField(item, ['channel_id', 'channelId', 'channelid']) ?? ''),
    userid: String(getField(item, ['user_id', 'userId', 'userid']) ?? ''),
    username: String(getField(item, ['user_name', 'userName', 'username']) ?? ''),
    usercode: String(getField(item, ['user_code', 'userCode', 'usercode']) ?? ''),
    loginname: String(getField(item, ['login_name', 'loginName', 'loginname']) ?? ''),
    firstname: String(getField(item, ['first_name', 'firstName', 'firstname']) ?? ''),
    middlename: String(getField(item, ['middle_name', 'middleName', 'middlename']) ?? ''),
    lastname: String(getField(item, ['last_name', 'lastName', 'lastname']) ?? ''),
    rolechannel: String(getField(item, ['role_channel', 'roleChannel', 'rolechannel']) ?? ''),
    gender: toNumber(getField(item, ['gender']), 0),
    address: String(getField(item, ['address']) ?? ''),
    email: String(getField(item, ['email']) ?? ''),
    birthday: String(getField(item, ['birthday']) ?? ''),
    status: String(getField(item, ['status']) ?? ''),
    statuscaption: String(getField(item, ['status_caption', 'statusCaption', 'statuscaption']) ?? ''),
    usercreated: String(getField(item, ['user_created', 'userCreated', 'usercreated']) ?? ''),
    lastlogintime: String(getField(item, ['last_login_time', 'lastLoginTime', 'lastlogintime']) ?? ''),
    usermodified: String(getField(item, ['user_modified', 'userModified', 'usermodified']) ?? ''),
    islogin: toBoolean(getField(item, ['is_login', 'isLogin', 'islogin'])),
    expiretime: String(getField(item, ['expire_time', 'expiretime']) ?? ''),
    branchid: String(getField(item, ['branch_id', 'branchId', 'branchid']) ?? ''),
    departmentcode: String(getField(item, ['department_code', 'departmentCode', 'departmentcode']) ?? ''),
    userlevel: toNumber(getField(item, ['user_level', 'userLevel', 'userlevel']), 0),
    usertype: String(getField(item, ['user_type', 'userType', 'usertype']) ?? ''),
    isshow: String(getField(item, ['is_show', 'isShow', 'isshow']) ?? ''),
    policyid: toNumber(getField(item, ['policy_id', 'policyId', 'policyid']), 0),
    uuid: String(getField(item, ['uuid']) ?? ''),
    failnumber: toNumber(getField(item, ['fail_number', 'failNumber', 'failnumber']), 0),
    issuperadmin: toBoolean(getField(item, ['is_super_admin', 'isSuperAdmin', 'issuperadmin'])),
    updatedonutc: String(getField(item, ['updated_on_utc', 'updatedOnUtc', 'updatedonutc']) ?? ''),
    createdonutc: String(getField(item, ['created_on_utc', 'createdOnUtc', 'createdonutc']) ?? ''),
    phone: String(getField(item, ['phone']) ?? ''),
    contractnumber: String(getField(item, ['contract_number', 'contractNumber', 'contractnumber']) ?? ''),
    usergroup: []
});

const mapMobileUserAccount = (item: any): UserMobileAccount => ({
    id: toNumber(getField(item, ['id']), 0),
    channel_id: String(getField(item, ['channel_id', 'channelId']) ?? 'MB'),
    user_id: String(getField(item, ['user_id', 'userId']) ?? ''),
    user_name: String(getField(item, ['user_name', 'userName', 'role_name', 'roleName']) ?? ''),
    user_code: String(getField(item, ['user_code', 'userCode']) ?? ''),
    login_name: String(getField(item, ['login_name', 'loginName']) ?? ''),
    first_name: String(getField(item, ['first_name', 'firstName']) ?? ''),
    middle_name: String(getField(item, ['middle_name', 'middleName']) ?? ''),
    last_name: String(getField(item, ['last_name', 'lastName']) ?? ''),
    role_channel: String(getField(item, ['role_channel', 'roleChannel']) ?? ''),
    user_type: String(getField(item, ['user_type', 'userType']) ?? 'MB'),
    phone: getField(item, ['phone']) ?? undefined,
    total_count: toNumber(getField(item, ['total_count', 'totalCount']), 0)
});

const RoleProfilePage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const sessiontoken = (await getServerBackendToken()) as string;

    // User Assignment tab tự quản lý phân trang server-side (xem useUserAssignment.ts) nên chỉ cần
    // seed trang 1 ở đây; Role list nhỏ, chưa có UI phân trang nên vẫn giữ page_size lớn để load hết.
    const [userResponse, roleResponse, mobileResponse] = await Promise.all([
        workflowService.runFODynamic({
            sessiontoken,
            workflowid: WORKFLOWCODE.WF_BO_SIMPLE_SEARCH_USER,
            input: { page_size: 10, page_index: 0, search_text: '', channel_code: 'BO' },
            language: locale
        }),
        workflowService.runFODynamic({
            sessiontoken,
            workflowid: WORKFLOWCODE.WF_BO_SEARCH_USER_ROLE,
            input: { page_size: 9999, page_index: 0, search_text: '', channel_code: 'BO' },
            language: locale
        }),
        workflowService.runFODynamic({
            sessiontoken,
            workflowid: WORKFLOWCODE.WF_BO_SEARCH_USER_ROLE,
            input: { page_size: 10, page_index: 0, search_text: '', channel_code: 'MB' },
            language: locale
        }),
    ]);

    const userData = mapPageData(userResponse, mapUserAccount, 0, 10, 'User');
    const roleData = mapPageData(roleResponse, mapRole, 0, 9999, 'Role');
    const mobileUserData = mapPageData(mobileResponse, mapMobileUserAccount, 0, 10, 'MobileUser');

    if (!roleData || !userData || !mobileUserData) return <Spinner />;

    return (
        <RoleProfileGeneric
            locale={locale}
            session={session}
            dictionary={dictionary}
            role={roleData}
            userdata={userData}
            mobileuserdata={mobileUserData}
        />
    );
};

export default RoleProfilePage;
