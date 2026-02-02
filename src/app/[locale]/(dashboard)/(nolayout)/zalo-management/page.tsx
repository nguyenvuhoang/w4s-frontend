import { auth } from '@/auth';
import { Locale } from '@/configs/i18n';
import ZaloManagementContent from '@/views/nolayout/zalo-management';
import { Box } from '@mui/material';
import { getDictionary } from '@utils/getDictionary';


type Params = Promise<{
    locale: Locale;
}>;

const ZaloManagementPage = async ({ params }: { params: Params }) => {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const session = await auth();

    return (
        <Box sx={{ p: 6 }}>
            <ZaloManagementContent dictionary={dictionary} session={session} />
        </Box>
    );
};


export default ZaloManagementPage;
