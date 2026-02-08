import { auth } from '@/auth';
import EmailDashboard from '@/components/email/EmailDashboard';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { dataService } from '@/servers/system-service/services/data.service';
import { getDictionary } from '@/shared/utils/getDictionary';
import type { Locale } from '@configs/i18n';
import {
    Menu as MenuIcon,
    Search as SearchIcon,
    Tune as TuneIcon
} from '@mui/icons-material';
import {
    Box,
    IconButton,
    InputBase,
    Paper,
    Stack,
    Typography
} from '@mui/material';

export default async function EmailNotificationPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ page?: string; size?: string }>
}) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const session = await auth();
    const sParams = await searchParams;
    const page = sParams.page ? parseInt(sParams.page) : 1;
    const size = sParams.size ? parseInt(sParams.size) : 20;

    let initialEmails: any[] = [];
    let totalCount = 0;
    let totalPages = 1;

    if (session?.user?.token) {
        try {
            const response = await dataService.searchSystemData({
                sessiontoken: session.user.token,
                workflowid: WORKFLOWCODE.WF_BO_MAIL_SEND_OUT,
                pageIndex: page,
                pageSize: size,
            });

            if (response.status === 200 && response.payload?.dataresponse?.data) {
                const dataResponse = response.payload.dataresponse.data;
                initialEmails = Array.isArray(dataResponse.items) ? dataResponse.items :
                    (Array.isArray(dataResponse.input?.items) ? dataResponse.input.items : []);

                // Handle different naming conventions for total count and pages
                totalCount = dataResponse.total_count ?? dataResponse.totalcount ??
                    dataResponse.input?.total_count ?? initialEmails.length ?? 0;
                totalPages = dataResponse.total_pages ?? dataResponse.totalpages ??
                    dataResponse.input?.total_pages ?? 1;
            }
        } catch (error) {
            console.error('[EMAIL_PAGE] Failed to fetch sent emails:', error);
        }
    }

    const headerStaticContent = (
        <>
            <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton sx={{ color: 'text.primary' }}>
                    <MenuIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {dictionary.email.gmail}
                    </Typography>
                </Box>
            </Stack>

            <Paper
                sx={{
                    flexGrow: 1,
                    maxWidth: 720,
                    mx: 4,
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 0.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    boxShadow: 'none',
                }}
            >
                <IconButton sx={{ p: 1, color: 'text.secondary' }}>
                    <SearchIcon />
                </IconButton>
                <InputBase
                    placeholder={dictionary.email.search_placeholder}
                    sx={{ ml: 1, flex: 1, color: 'text.primary' }}
                />
                <IconButton sx={{ p: 1, color: 'text.secondary' }}>
                    <TuneIcon />
                </IconButton>
            </Paper>
        </>
    );

    return (
        <EmailDashboard
            headerContent={headerStaticContent}
            initialEmails={initialEmails}
            totalCount={totalCount}
            totalPages={totalPages}
            currentPage={page}
            pageSize={size}
            dictionary={dictionary}
            locale={locale}
            session={session}
        />
    );
}
