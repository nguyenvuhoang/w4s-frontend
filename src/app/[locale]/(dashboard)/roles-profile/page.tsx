import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { dataService, systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@utils/getDictionary'
import { isValidResponse } from '@utils/isValidResponse'
import RoleProfileGeneric from '@/views/pages/role-profile'

// ✅ Hàm gom xử lý gọi API với kiểm tra lỗi và trả về kết quả
const fetchBOData = async ({
    sessiontoken,
    workflowid,
    commandname,
    searchtext = '',
    pageSize = 9999,
    pageIndex = 1,
    label
}: {
    sessiontoken: string
    workflowid: string
    commandname: string
    searchtext?: string
    pageSize?: number
    pageIndex?: number
    label: string // để log dễ hiểu hơn
}) => {
    const response = await dataService.searchData({
        sessiontoken,
        workflowid,
        commandname,
        searchtext,
        pageSize,
        pageIndex,
    });

    if (
        !isValidResponse(response) ||
        (response.payload.dataresponse.errors && response.payload.dataresponse.errors.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            response.payload.dataresponse.errors[0].execute_id +
            ' - [' + label + '] - ' +
            response.payload.dataresponse.errors[0].info
        );
        return null;
    }
    const data = response.payload.dataresponse.data;
    return data;
};

const RoleProfilePage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const [roleData, userData, mobileUserData] = await Promise.all([
        fetchBOData({
            sessiontoken: session?.user?.token as string,
            workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
            commandname: 'SimpleSearchUserRole',
            label: 'Role'
        }),
        fetchBOData({
            sessiontoken: session?.user?.token as string,
            workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
            commandname: 'SimpleSearchUser',
            label: 'User'
        }),
        fetchBOData({
            sessiontoken: session?.user?.token as string,
            workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
            commandname: 'SimpleSearchMobileUser',
            label: 'MobileUser',
            pageSize: 10,
            pageIndex: 1,
        }),
    ]);
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
