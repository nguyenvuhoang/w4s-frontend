import PartnerScanner from '@/features/partner-portal/components/PartnerScanner'
import PartnerShell, { PartnerHeading } from '@/features/partner-portal/components/PartnerShell'
export default function PartnerScanPage() { return <PartnerShell active="scan"><PartnerHeading title="Quét mã ưu đãi" subtitle="Kiểm tra thông tin trước khi xác nhận sử dụng voucher." /><PartnerScanner /></PartnerShell> }
