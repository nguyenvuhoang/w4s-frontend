import { Locale } from "@/configs/i18n";
import { ResponseArray, ResponseArrayData, ResponseData, ResponseDefault, ResponseDefaultData } from ".";


export interface DefaultData {

}

export interface SystemDataRequest {
    sessiontoken: string | unknown
    language: Locale
}

export interface AccountInfoType {
    accountnumber: string
    accounttype: string
    currencycode: string
    isprimary: boolean
}

export interface AccountType {
    account: AccountInfoType | string
    listofaccount: AccountInfoType[]
}

export interface BankDataResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<AccountType>>
}


export interface BalanceType {
    currentbalance: number | undefined
    currencycode: string
    availablebal: number | undefined
}
export interface BalanceDetailResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<BalanceType>>
}

export interface AccountDetail {
    account: string
    wallet: string
    accountnumber: string
    accounthoder: string
    nickname: string
    availablebalance: number
    currentbalance: number
    overdraftlimit: number
    holdamount: number
    overdraftinterest: number
    interestrate: number
    accumulatedinterest: number
    opendate: string
    lasttransactiondate: string
    ref_id: string
}

export interface AccountDetailData {
    data: AccountDetail
}

export interface AccountDetailResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<AccountDetailData>>
}

export interface BankInfo {
    name: string
    code: string
    bin: string
    shortname: string
    logo: string
    transfersupported: number
    lookupsupported: number
    support: number
    istransfer: number
    swiftcode: any
    id: number
}

export interface BankList {
    listbank: BankInfo[]
}
export interface BankInfoResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<BankList>>
}

export interface Bankinfor {
    logo: string
    lookupsupported: number
    name: string
    bankcode: string
    shortname: string
}
export interface TemplateTransfer {
    id: number
    applicationcode: string
    templatecode: string
    templatename: string
    description: string
    senderaccount: string
    receiveraccount: string
    amount: number
    currencycode: string
    transactioncode: string
    usercode: string
    executenow: string
    executedate: string
    chargefee: string
    citycode: string
    countrycode: string
    identifyno: any
    issuedate: any
    issueplace: any
    receivername: string
    bankcode: string
    sendername: string
    receiveradd: any
    branch: string
    branchdesc: string
    receiverid: any
    bankinfor: Bankinfor[]
}
export interface ListTemplate {
    listtemplate: TemplateTransfer[]
}
export interface TemplateTransferResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<ListTemplate>>
}

export interface BenificiaryInfo {
    id: number
    code: string
    usercode: string
    receivername: string
    acctno: string
    transfertype: string
    license: string
    issueplace: any
    issuedate: any
    description: string
    status: string
    address: any
    citycode: string
    bankcode: string
    branch: string
    branchdesc: string
    bankinfor: Bankinfor[]
}
export interface BenificiaryList {
    listreceiver: BenificiaryInfo[]
}
export interface BenificiaryListResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<BenificiaryList>>
}


export interface BenificiaryData {
    data: BenificiaryInfo
}

export interface BenificiaryInfoResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefault<ResponseData<BenificiaryData>>
}


export interface AccountHistory {
    transactioncode: string
    transactionnumber: string
    transactiondate: string
    createdby: string
    debit: number
    credit: number
    balance: number
    description: string
}
export interface AccountHistoryData {
    history: AccountHistory[]
}

export interface AccountHistoryInfoResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefaultData<ResponseData<AccountHistoryData>>
}

export interface FavoriteFeature {
    id: number
    subitemcode: string
    icon: string
    label: string
    description: any
    favorite: boolean
    url: string
}
export interface FavoriteFeatureData {
    functionschoosen: FavoriteFeature[]
}
export interface FavoriteFeatureOfUser extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefaultData<ResponseData<FavoriteFeatureData>>
}

export interface SubFavoriteFeature {
    id: number
    subitemcode: string
    icon: string
    label: string
    favorite: boolean
    url: string
}
export interface ListFavoriteFeature {
    itemcode: string
    itemname: string
    subitem: SubFavoriteFeature[]
}
export interface ListFavoriteFeatureData {
    favoriteItems: ListFavoriteFeature[]
}
export interface ListFavoriteFeature extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefaultData<ResponseData<ListFavoriteFeatureData>>
}

export interface UpdateFavoriteFeatureOfUserResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseDefaultData<DefaultData>
}

export interface Productname {
    vi: string
    en: string
    thai: string
    lao: string
    cam: string
    mya: string
}

export interface Description {
    vi: string
    en: string
    thai: string
    lao: string
    cam: string
    mya: string
}
export interface LoanProduct {
    productcode: string
    productname: string
    productimage: string
    description: string
    usercode: string
    isallowregister: boolean
    producturl: string

}
export interface LoanProductData {
    data: LoanProduct[]

}
export interface LoanProductResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<LoanProductData>>
}

// Type For Saving Product
export interface SavingProductItem {
    productcode: string
    productname: string
    productimage: string
    description: string
    usercode: string
    isallowregister: boolean
    producturl: string
}

export interface SavingProductList {
    data: SavingProductItem[] // // Array of SavingProductItem
}

export interface SavingProductResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<SavingProductList>>
}
export interface CardList {
    id: number
    usercode: string
    cardcode: string
    cardnumber: string
    cardlogo: string
    cardname: string
    cardtype: string
    cardholdername: string
    cardlimit: number
    availablelimit: number
    balance: number
    status: string
    isprimary: boolean
    cardexpirydate: string
    linkagedaccount: string
}
export interface CardListData {
    data: CardList[]
}
export interface CardListResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<CardListData>>
}
export interface CardByID {
    id: number
    usercode: string
    cardcode: string
    cardnumber: string
    cardlogo: string
    cardname: string
    cardholdername: string
    cardlimit: number
    availablelimit: number
    balance: number
    status: string
    isprimary: boolean
    cardexpirydate: string
    linkagedaccount: string
}
export interface CardByIDData {
    data: CardByID
}
export interface CardByIDResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<CardByIDData>>
}

export interface FundTransferDataRequest {
    from_account_number: string
    to_account_number: string
    amount: number
    currency_code: string
    description: string
    fee_deposit_tranfer_amount: number
    transaction_reference: number
    sessiontoken: string
    language: string
}

export interface PointOfUser {
    result: number
}

export interface PointOfUserResponse extends ResponseDefaultData<DefaultData> {
    dataresponse: ResponseArray<ResponseData<PointOfUser>>
}

export interface Report {
    id: number
    code: string
    name: string
    version: string
    codetemplate: string
    datasource: string
    fullclassname: string
    methodname: string
    description: string
    isasync: boolean
    mailconfigcode: string
    status: string
    organizationid: any
    totalcount: number
};

export interface ReportParam {
    id: number
    reportdetailid: string
    reportid: string
    paramname: string
    controlname: string
    controltype: string
    width: number
    height: number
    ddlstore: string
    ddltext: string
    ddlvalue: string
    langid: string
    orderby: number
    tag: string
    timereport: any
}

export interface Customer {
    custid: string
    fullname: string
    shortname: string
    dob: string
    addrresident: string
    addrtemp: string
    sex: string
    nation: string
    tel: string
    fax: string
    email: string
    licensetype: string
    licensetypecaption: string
    licenseid: string
    issuedate: string
    issueplace: string
    description: string
    officeaddr: string
    officephone: string
    cftype: string
    customertypecaption: string
    branchid: string
    status: string
    statuscaption: string
    custcode: string
    cfcode: string
    ctype: string
    phonecountrycode: string
    kycid: string
    usercreated: string
    datecreated: string
    township: string
    region: string
    fullnamemm: string
    addrmm: string
    phonemm: string
    latitude: string
    longitude: string
    agentlocation: string
    id: number
    sourcetype: string
    firstname: string
    middlename: string
    lastname: string
}
export interface GLAccount {
    sysaccountname: string
    catalogcode: string
    glaccount: string
    id: number
}
export interface Contractaccount {
    contractnumber: string
    accountnumber: string
    accounttype: string
    currencycode: string
    status: string
    statuscaption: string
    branchid: string
    bankaccounttype: string
    isprimary: boolean
    glaccounts: GLAccount[]
}
export interface ContractDocument {
    id: number,
    documentid: string,
    documentcode: string,
    documentname: string,
    documenttype: string,
    filecontent: string,
    usercode: string,
    custid: string,
    status: string,
    usercreated: string,
    datecreated: Date,
    requestid: string
}
export interface Contract {
    contractnumber: string
    customercode: string
    contracttype: string
    contracttypecaption: string
    usertype: string
    productid: string
    branchid: string
    createdate: string
    enddate: string
    usercreate: string
    userapprove: string
    status: string
    statuscaption: string
    isreceiverlist: string
    isautorenew: string
    contractlevelid: number
    mer_code: string
    shopname: string
    localshopname: string
    parentcontract: string
    controltype: string
    transactionid: string
    id: number
    contractaccount: Contractaccount[]
    customer: Customer[]
    agentcustomer: Customer[]
    customer_any: Customer
    documents: ContractDocument[]
}

export interface UserGroup {

}

export interface UserAccount {
    id: number;
    channelid: string;
    userid: string;
    username: string;
    usercode: string;
    loginname: string;
    firstname: string;
    middlename: string;
    lastname: string;
    rolechannel: string;
    gender: number;
    address: string;
    email: string;
    birthday: string;
    status: string;
    statuscaption: string;
    usercreated: string;
    lastlogintime: string;
    usermodified: string;
    islogin: boolean;
    expiretime: string;
    branchid: string;
    departmentcode: string;
    userlevel: number;
    usertype: string;
    isshow: string;
    policyid: number;
    uuid: string;
    failnumber: number;
    issuperadmin: boolean;
    updatedonutc: string;
    createdonutc: string;
    phone: string;
    contractnumber: string;
    usergroup: UserGroup[];
}

export type NationCode = 'US' | 'VN' | 'LA' | 'JP' | 'FR';
export type AccountsType = 'DD' | 'FD' | 'LN' | 'RV' | 'WAL';


export interface AccountActivity {
    id: number
    userid: string
    loginname: string
    token: string
    refreshtoken: string
    refreshtokenexpiresat: string
    ipaddress: string
    expiresat: string
    isrevoked: boolean
    channelid: string
    createdonutc: string
    updatedonutc: string
    channelroles: string
    usercode: string
    branchcode: string
    username: string
    device: string
}

export interface SMSContentType {
    id: number
    phonenumber: string
    messagecontent: string
    sentat: string
    status: string
    requestmessage: string
    responsemessage: string
    smsproviderid: string
    otprequestid: string
    providermsgid: string
    elapsedmilliseconds: number
    retrycount: number
    isresend: boolean
    TotalCount: number
}

export interface MailConfig {
    config_id: string
    host: string
    port: number
    sender: string
    password: string
    enable_tls: boolean
    email_test: string
}

export interface MailTemplate {
    template_id: string
    status: string
    description: string
    subject: string
    body: string
    data_sample: string
    send_as_pdf: boolean
    attachments: string
}


export interface SettingItem {
    id: number
    name: string
    value: string
    organization_id: string
}

export interface StoreCommandType {
    id: number
    name: string
    query: string
    type: string
    description: string
    created_on_utc: Date
    updated_on_utc: Date
}

export interface Transaction {
    user_code: string
    user_name: string
    login_name: string
    branch_code: string
    response_body: string
    start_time: number
    duration: number
    page_index: number
    page_size: number
    app_code: any
    transaction_code: string
    transaction_number: string
    transaction_type: any
    sub_code: any
    transaction_date: string
    service_sys_date: string
    reference_id: string
    ref_id: string
    reference_code: string
    business_code: string
    value_date: string
    current_user_code: any
    current_branch_code: any
    current_username: any
    current_loginname: any
    user_approve: any
    status: string
    is_reverse: boolean
    amount1: number
    description: string
    token: any
    language: any
    is_transaction_compensated: boolean
    client_device_id: any
    command_list: any[]
    channel_id: string
    trans_id: string
    error_code: string
    error_desc: string
    request_body: string
}

export interface CoreConfigData {
    active_core_code: string
    mode: string
    effective_from: string
    effective_to: string
    switched_by: string
    switched_reason: string
    is_fallback_enabled: boolean
    fallback_core_code: string
    last_updated: string
    updated_by: string
    core_system_name: string
    connection_type: string
    connection_config_json: string
    is_active: boolean
    timeout_seconds: number
    retry_policy_json: string
    use_cache: boolean
    cache_type: string
    cache_ttl_seconds: number
    extra_metadata_json: string
    detail_last_updated: string
    detail_updated_by: string
}

export interface ConnectionCoreInfo {
    bankactive: string
    branchcd: string
    branchid: number
    brname: string
    busdate: string
    comcode: string
    comtype: string
    deprtcd: string
    deprtid: number
    e: string
    expdt: string
    isonline: string
    isvalidatepolicy: boolean
    lang: string
    lastdt: string
    lgname: string
    mac: string
    menu: any
    menuarc: string[]
    minpwdlen: number
    policyid: number
    pwdagemax: number
    pwdagemin: number
    pwdcnt: number
    pwdreset: string
    pwdstr: string
    roleid: number
    serid: string
    status: string
    txdef: string[]
    usrac: Usrac
    usrcd: string
    usrid: number
    usrname: string
    uuid: string
    wsip: string
    wsname: string
    token: any
    branch_status: any
}

export interface Usrac {
    usrid: number
    usrcd: string
    urefid: any
    usrname: string
    lgname: string
    branchid: number
    deprtid: number
    position: Position
    lang: string
    phone: any
    mphone: Mphone
    status: string
    pwdchg: string
    pwdexp: string
    pwdchgr: string
    wsreg: any
    pwdhis: number
    pwdagemax: number
    pwdagemin: number
    minpwdlen: number
    pwdcplx: string
    lginfr: string
    lginto: string
    timezn: number
    numfmtt: string
    numfmtd: string
    datefmt: string
    ldatefmt: any
    timefmt: string
    lkoutdur: number
    lkoutthrs: number
    resetlkout: number
    policyid: number
    expdt: any
    udfield1: string
    iscash: string
    remark: any
}

export interface Position {
    D: number
    S: number
    B: number
    C: number
    L: number
    O: number
    I: number
}

export interface Mphone {
    T: string
    C: string
    F: string
    E: string
    H: string
    W: string
    O: string
}

export interface AcceptLogItem {
    log_level_id: number;
    service_id: string;
    channel_id: string;
    status: string | null;
    short_message: string;
    full_message: string;
    user_id: string;
    reference: string;
};

export interface RequestLogItem {
    request_id: string;
    http_method: string;
    request_url: string;
    request_headers: string;
    request_body: string;
    client_ip: string;
    user_agent: string;
    response_status_code: number;
    response_headers: string;
    response_body: string;
    service_id: string;
    reference: string;
    exception_message: string;
    stack_trace: string;
    app_code: string;
    transaction_code: string;
    transaction_number: string;
    transaction_type: string;
    sub_code: string;
    transaction_date: string;
    service_sys_date: string;
    reference_id: string;
    ref_id: string;
    reference_code: string;
    business_code: string;
    value_date: string;
    current_user_code: string;
    current_branch_code: string;
    current_username: string;
    current_loginname: string;
    user_approve: string;
    status: string;
    is_reverse: boolean;
    amount1: number;
    description: string;
    token: string;
    language: string;
    is_transaction_compensated: boolean;
    client_device_id: string;
    command_list: any[];
}

export interface ErrorLogItem {
    execution_id: string
    input: string
    workflow_id: string
    status: number
    error: any
    created_on: number
    finish_on: number
    is_timeout: any
    is_processing: any
    is_success: any
    workflow_type: any
    response_content: string
    reversed_execution_id: any
    reversed_by_execution_id: any
    is_disputed: any
    archiving_time: number
    purging_time: number
    approved_execution_id: any
    transaction_number: any
    transaction_date: string
    value_date: string
    app_code: any
    transaction_code: any
    transaction_type: any
    sub_code: any
    service_sys_date: string
    reference_id: any
    ref_id: any
    reference_code: any
    business_code: any
    current_user_code: any
    current_branch_code: any
    current_username: any
    current_loginname: any
    user_approve: any
    is_reverse: boolean
    amount1: number
    description: any
    token: any
    language: any
    is_transaction_compensated: boolean
    client_device_id: any
    command_list: any[]
}

export interface ContractType {
    id: number
    contractnumber: string
    phone: string
    fullname: string
    idcard: string
    usercreate: string
    opendate: string // ISO 8601 string, you may cast to Date if needed
    expiredate: string // same as above
    corebankingcifnumber: string
    status: 'Active' | 'Inactive' | string // Extend with possible statuses
    branchcode: string
    TotalCount: number
    status_caption: string
    request_refid: string
}

export interface CoreInboundMessageType {
    id: number
    end_to_end: string
    execution_id: string
    channel_id: string
    service_id: string
    transaction_code: string
    headers: string
    request_body: string
    request_data: string
    nounce: string
    timestamp: string
    signature: string
    signature_verified: boolean
    status: string // RECEIVED | VERIFIED | FAILED | COMPLETED
    error_code?: number
    error_name?: string
    error_description?: string
    created_on_utc: Date
    updated_on_utc: Date
    total_count: number
}

export interface CoreOutboundMessageType {
    id: number
    execution_id: string
    reference: string
    message_type: string
    target_endpoint: string
    http_method: string
    request_body: string
    response_body: string
    status: string // "QUEUED" | "SENDING" | "SUCCESS" | "FAILED" | "DEAD"
    http_status?: number | null
    attempt_count: number
    max_attempt: number
    next_attempt_on_utc: Date
    last_error: string
    created_on_utc: Date
    updated_on_utc: Date
    total_count: number
}

export interface CoreSessionType {
    id: number
    token: string
    refresh_token: string
    user_id: string
    login_name: string
    reference: string
    ip_address: string
    device: string
    workingdate: string
    expires_at: string
    is_revoked: boolean
    revoke_reason: string
    channel_id: string
    updated_on_utc: string
    created_on_utc: string
    command_list: string
    branch_code: string
    total_count: number
}

export interface UserDeviceType {
    id: number
    user_code: string
    device_id: string
    device_type: string
    channel_id: string
    status: string
    push_id?: string
    user_agent: string
    ip_address: string
    os_version?: string
    app_version?: string
    device_name?: string
    brand?: string
    is_emulator: boolean
    is_rooted_or_jailbroken: boolean
    last_seen_date_utc: string
    total_count: number
}
export interface AccountChartType {
    accountlevel: number,
    accountnumber: string,
    currency: string,
    accountname: string,
    classification_code: string,
    classification: string,
    balanceside_code: string,
    balanceside: string,
    group_code: string,
    group: string,
    totalcount: number
    id: number
}

export interface PageLanguageResponse<T> {
    items: T;
    total: number;
    page_index: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_prev: boolean;
    has_next: boolean;
}

export interface LanguageDataMobileType {
    json_content: string
    language: string
}

export interface ChannelType {
    id: 2,
    channel_id: string,
    channel_name: string,
    description: string,
    status: boolean,
    is_always_open: boolean,
    time_zone_id: string,
    weekly: Array<any>
}

export interface V {
    id: number;
    channel_id: string;
    user_id: string;
    user_name: string;
    user_code: string;
    login_name: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    role_channel: string;
    user_type: string;
    phone?: string; // Add phone for mobile user display
    total_count?: number;
}

export interface PageDefaultResponse<T> {
    items: T;
    total: number;
    page_index: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_prev: boolean;
    has_next: boolean;
}

export interface UserMobileAccount {
    id: number;
    channel_id: string;
    user_id: string;
    user_name: string;
    user_code: string;
    login_name: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    role_channel: string;
    user_type: string;
    phone?: string; // Add phone for mobile user display
    total_count?: number;
}
export interface PostingType {
    acgrp: string
    date: string
    acname: string
    txrefid: string
    amount: number
    credit_amount: number
    acidx: number
    dorc: string
    debit_amount: number
    acno: string
    currencycode: string
    branchid: number
}
