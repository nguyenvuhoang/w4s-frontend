import { Locale } from "@/configs/i18n";
import { Session } from 'next-auth';
import { FormResponseData, ResponseData, ResponseDataPortal, ResponseDefault, ResponseDefaultData, ResponseDefaultPortal, ResponseListDefault } from ".";
import { VerticalMenuDataType, VerticalSubMenuDataType } from "./menuTypes";


export interface DefaultData {
    avatar: string
    usercommand: VerticalMenuDataType[]

}

export interface SystemDataRequest {
    sessiontoken: string
    language: Locale,
    formid?: string
    application?: string
}
export interface SystemViewDataRequest {
    sessiontoken: string
    language: Locale,
    [key: string]: any;
}
export interface SystemSearchDataRequest {
    sessiontoken: string
    language: Locale,
    page_index?: number
    page_size?: number
    search_text?: string
    pageindex?: number
    pagesize?: number
    searchtext?: string
    [key: string]: any;
    fields?: { [key: string]: any }
}
export interface SubmitDataFormRequest {
    sessiontoken: string
    language: Locale,
    fields: any
    [key: string]: any;
}
export interface UserInRole {
    role_id: number,
    user_code: string,
    is_main: string,
    updated_on_utc: Date,
    created_on_utc: Date,
    id: number
}
export interface RoleChannel {
    id: number,
    channel_id: string
    channel_name: string
    sort_order: number
    app_icon?: string
    description?: string
}
export interface SystemData {
    user_command: VerticalSubMenuDataType[]
    avatar: string
    name: string
    role: UserInRole[]
    is_agreement: boolean | string
    is_first_login: boolean | string
    login_name: string
    role_channel: RoleChannel[]
}

export interface SystemDataResponse extends ResponseDefaultData<DefaultData> {
    requireLogout: any;
    dataresponse: ResponseDefault<SystemData>
}

export interface SystemDataListResponse extends ResponseDefaultData<DefaultData> {
    requireLogout: any;
    dataresponse: ResponseListDefault<SystemData>
}
export interface UpdateTokenRealResponse {
    status: string
}


export interface FormField {
    label: string;
    name: string;
    required: boolean;
    type: string;
    options?: string[]; // Only for select fields
}
export interface TableDataRow {
    learnApiId: string;
    learnApiName: string;
    app: string;
    dataAPI: string;
    method: string;
}

export interface HeaderTableData {
    learn_api_id: string;
    learn_api_name: string;
    app: string;
    dataAPI: string;
    method: string;
}
export interface TableData {
    headers: Record<string, string>;
    data: Array<Record<string, any>>;
}

export interface TabContent {
    label: string;
    content: {
        formfields: FormField[];
        tabledata: TableData;
    }
}

export interface PageContent {
    pagecontent: TabContent[]
}

export interface RuleStrong {
    code: string
    config: any
    inUse: boolean
    isStart: boolean
    order: number
    isDidStart?: boolean
    isOpenFromOther?: boolean
    isStatus?: boolean
}
export interface FormInfo {
    title: string
    des: string
    data: string
    learnapi: string
    learnsql: string
    last_update: string
    bodata: string
    openOne: string
    url_input: string
    lang_form: any
    mode_form: any
    form_code: string
    ruleStrong: RuleStrong[]
    app: string
}

export interface ListView {
    isTab?: string;
    lang?: any;
    code: string
    name: string
    inputtype: string
    list_input: any
    codeHidden: string
}

export interface FormLayout {
    id: string
    name: string
    des: string
    inputtype: string
    class: string
    list_view: ListView[]
    codeHidden: string
    isTab?: string
}

export interface MobileConfig {
    fieldName: string
    title: string
    valueType: string
    config: Object
}

export interface MobileSearchButton {
    fieldName: string
    label: string
    type: string
    config: {
        learnApiId: string
    }
}
export interface MobileContent {
    fieldName: string
    label: string
    type: string
    config: MobileConfig[]
    learnApiIdLoadMore?: string
    searchButton?: MobileSearchButton
    viewTemplateID?: string
    viewWorkflowID?: string
    viewParam?: string
    required?: boolean
    isSeparator?: boolean
    defaultValue?: any
    visible?: boolean
    child?: any
}
export interface FormLayoutMobile {
    viewName?: string
    viewLabel?: string
    isTab: boolean
    content: MobileContent[]
}
export interface FormDesignDetail {
    id: number
    info: FormInfo
    list_layout: FormLayout[]
    form_id: string
    app: string
}

export interface FormData {
    status: string
    loadRoleTask: any
    form_design_detail: FormDesignDetail
}

export interface FormDataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: FormResponseData<FormData>
}

export interface MenuDataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: FormResponseData<MenuItem>
}

export type FormInput = {
    inputtype: string;
    [key: string]: any;
};

export type FormView = {
    id?: string;
    code: string;
    name: string;
    isTab?: string;
    isBox?: string;
    inputtype: string;
    list_input: FormInput[];
    isBorder?: string;
    lang?: any;
};

export interface LearnDataRequest {
    sessiontoken: string | unknown
    learnapi: string
    pageSize: number
    pageIndex: number
}

export interface PageData<T> {
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
    items: T[]
    pageindex?: number
    pagesize?: number
    page_index?: number
    page_size?: number
}

export interface TableDataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefaultPortal<ResponseDataPortal<PageData<any>>>
}

export interface DataRequest {
    sessiontoken: string | unknown
}

export interface ResponseSubmitPortal<T> {
    status: boolean
    message: string
    data: T
    [key: string]: any;
}
export interface SubmitDataResponse extends ResponseDefaultData<{}> {
    dataresponse: ResponseSubmitPortal<ResponseDataPortal<any>>
}

export interface SystemCode {
    id: number
    codeid: string
    codename: string
    caption: string
    languagecaption: string
    codegroup: string
    codeindex: number
    codevalue: string
    ftag: any
    visible: boolean
}

export interface SystemCodeDataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<ResponseDefaultPortal<SystemCode[]>>>
}


export interface SearchDataRequest {
    sessiontoken: string | unknown
    learnapi?: string
    workflowid?: string
    commandname?: string
    pageSize?: number
    pageIndex?: number
    parameters?: { [key: string]: any }
    searchtext?: string
    issearch?: boolean
    advanccesearch?: any
    language?: Locale
    [key: string]: any;
}

export interface ViewDataRequest {
    sessiontoken: string | unknown
    learnapi?: string
    workflowid?: string
    commandname?: string
    parameters?: any
    issearch?: boolean
    language?: Locale
}

export interface UpdateDataRequest {
    sessiontoken: string | unknown
    learnapi?: string
    workflowid?: string
    data: any
}

export interface ViewDataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<ResponseDefaultPortal<any> | any>>
}


export interface SearchDataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<PageData<any>>>
}

export interface BODataResponse<T = any> extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<T>>
}

export interface FODataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<any>>
}

export interface RunFoDataRequest {
    sessiontoken: string | unknown
    learnapi: string
    workflowid: string
}
export interface RunFoDynamicDataRequest {
    sessiontoken: string | unknown
    input?: any
    use_microservice?: boolean
    workflowid: string
    language?: Locale
}
export interface RunBoDynamicDataRequest {
    sessiontoken: string | unknown
    txFo: any
}

export interface FODataArrayResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<PageData<any>>>
}

export interface ReportDataRequest {
    sessiontoken: string | unknown
    pageindex: number
    pagesize: number
}
export interface ReportDetailDataRequest {
    sessiontoken: string | unknown
    pageindex: number
    pagesize: number
    reportid: string | undefined
    langid: Locale
}

export interface MenuItem {
    application_code: string
    command_id: string
    parent_id: string
    command_name: string
    command_name_language: string
    command_type: string
    command_uri: string
    is_visible: boolean
    display_order: number
    group_menu_icon: string
    group_menu_visible: string
    group_menu_id: any
    group_menu_list_authorize_form: any
    enable: boolean
    href: string
    icon: string
    label: string
    children?: MenuItem[]
}

export interface Operation {
    operation_header: OperationHeader[]
    operation_body: OperationBody[]
}

export interface OperationHeader {
    cmdid: string
    caption: string
}

export interface OperationBody {
    role_id: number
    role_name: string
    parent_id: string
    command_id: string
    command_name: string
    command_id_detail: any
    invoke: number
    approve: number
    application_code: string
    command_type: string
    group_menu_icon: string
    group_menu_visible: string
    group_menu_id: string
    group_menu_list_authorize_form: any
}

export interface Service {
    id: number
    servicecode: string
    servicename: string
    description: string
    order: number
    status: boolean
    totalcount: number
}

export interface Role {
    id: number
    roleid: number
    rolename: string
    roledescription: string
    usertype: string
    contractno: any
    usercreated: string
    datecreated: string
    usermodified: any
    datemodified: any
    serviceid: string
    roletype: string
    status: string
    isshow: string
    order: number
    totalcount: number
}


export interface SubmitDataRequest {
    sessiontoken: string | unknown
    learnapi?: string
    workflowid?: string
    commandname?: string
    pageSize?: number
    pageIndex?: number
    parameters?: any
    searchtext?: string
    issearch?: boolean
    advanccesearch?: any
    language?: Locale
    data?: any
}

export interface FilesDataResponse {
    message: string;
    fileUrl: string
    trackerCode: string | null;
    expiredOnUtc: Date | null;
    temp: boolean;
    status: string;
}

export interface RunDynamicDataRequest {
    body: any;
    sessiontoken: Session | string | unknown;
}

export interface OpenAPIType {
    client_id: string,
    client_secret: string,
    client_name: string,
    environment: string,
    scopes: string,
    expired_on_utc: string,
    is_revoked: boolean,
    is_active: boolean,
    created_on_utc: string,
    created_by: string,
    last_used_on_utc: Date | null,
    usage_count: number,
    status: string,
    id: string,
    is_expired: boolean,
    is_inactive: boolean,
    allowed_ip_addresses: string,
    description: string,
    bic_code?: string,
    rate_limit_per_minute?: number,
    token_life_time_in_seconds?: number,
    refresh_token_life_time_in_seconds?: number,
    deactivated_at?: string | null
}

export interface ApplicationLogItem {
    log_timestamp: string;
    log_level: string;
    service_name: string;
    correlation_id: string;
    log_type: string;
    direction: string | null;
    action_name: string | null;
    flow: string | null;
    duration_ms: number;
    exception_details: string | null;
    properties: string | null;
    message: string | null;
    headers: string | null;
    request_payload: string | null;
    response_payload: string | null;
    id: number;
    created_on_utc: string;
    updated_on_utc: string;
}

export interface LearnAPIType {
    id: number
    learn_api_id: string
    learn_api_name: string
    learn_api_data: string
    learn_api_node_data: string
    learn_api_method: string
    learn_api_header: string
    learn_api_mapping: string
    key_read_data: string
    learn_api_id_clear: string | null
    channel: string
    learn_api_mapping_response: string
    full_interface_name: string
    method_name: string
    uri: string
    is_internal: boolean
    is_cache: boolean
}

export interface CalendarType {
    id: number,
    sqn_date: Date,
    is_current_date: number,
    is_holiday: number,
    is_end_of_week: number,
    is_end_of_month: number,
    is_end_of_quater: number,
    is_end_of_half_year: number,
    is_end_of_year: number,
    is_begin_of_week: number,
    is_begin_of_month: number,
    is_begin_of_quater: number,
    is_begin_of_half_year: number,
    is_begin_of_year: number,
    is_fiscal_end_of_week: number,
    is_fiscal_end_of_month: number,
    is_fiscal_end_of_quater: number,
    is_fiscal_end_of_half_year: number,
    is_fiscal_end_of_year: number,
    is_fiscal_begin_of_week: number,
    is_fiscal_begin_of_month: number,
    is_fiscal_begin_of_quater: number,
    is_fiscal_begin_of_half_year: number,
    is_fiscal_begin_of_year: number,
    descs: string,
    currency_code: string
}

export interface WorkflowInfo {
    execution_id: string
    correlation_id: string
    input: any
    input_string: string
    workflow_id: string
    status: number | string
    error: any
    error_info: any
    created_on: number
    finish_on: number
    is_timeout: any
    is_processing: any
    is_success: any
    workflow_type: any
    response_content: any
    reversed_execution_id: any
    reversed_by_execution_id: any
    is_disputed: any
    archiving_time: number
    purging_time: number
    approved_execution_id: any
    transaction_number: any
    transaction_date: string
    value_date: string
    app_code?: string
}

export interface WorkflowStepInfoList {
    should_await: boolean
    step_execution_id: string
    execution_id: string
    step_order: number
    step_code: string
    sending_condition: any
    p1_request: any
    p1_start: number
    p1_finish: number
    p1_status: string
    p1_error: any
    p1_content: any
    p2_request: any
    p2_start: number
    p2_finish: number
    p2_status: string
    p2_error: any
    p2_error_code: any
    p2_content: any
    is_success: any
    is_timeout: any
    execution_service: any
}

export interface WorkflowLogDetailData {
    workflow_info: WorkflowInfo
    workflow_step_info_list: WorkflowStepInfoList[]
}
