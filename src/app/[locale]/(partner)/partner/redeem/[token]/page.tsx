import { Alert } from '@mui/material'
import PartnerShell, { PartnerHeading } from '@/features/partner-portal/components/PartnerShell'
import RedeemVoucherCard from '@/features/partner-portal/components/RedeemVoucherCard'
import { getDemoVoucher } from '@/features/partner-portal/demo'
import { partnerDemoMode, runPartnerWorkflow } from '@/features/partner-portal/server/partnerWorkflow'
import type { PartnerVoucher } from '@/features/partner-portal/types'
export default async function PartnerRedeemPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; const result = partnerDemoMode ? { success: true, data: getDemoVoucher(token) } : await runPartnerWorkflow<PartnerVoucher>(process.env.IPS_PARTNER_VERIFY_WORKFLOW, { token }); return <PartnerShell active="scan"><PartnerHeading title="Kiểm tra ưu đãi" subtitle="Đối chiếu thông tin với cư dân trước khi xác nhận." />{result.success && result.data ? <RedeemVoucherCard voucher={result.data} /> : <Alert severity="error">{result.message ?? 'Voucher không hợp lệ.'}</Alert>}</PartnerShell> }
