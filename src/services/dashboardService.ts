import type {
  DashboardAccessStat,
  DashboardActivityLog,
  DashboardOverview,
  DynamicQrPaymentLog,
  ProjectPaymentConfig,
  VoucherSummary
} from '@/types/dashboard'

const accessStatistics: DashboardAccessStat[] = [
  { label: 'T2', mobile: 1200, admin: 320 },
  { label: 'T3', mobile: 1450, admin: 410 },
  { label: 'T4', mobile: 1320, admin: 360 },
  { label: 'T5', mobile: 1680, admin: 520 },
  { label: 'T6', mobile: 1540, admin: 480 },
  { label: 'T7', mobile: 980, admin: 260 },
  { label: 'CN', mobile: 760, admin: 180 }
]

const voucherSummary: VoucherSummary = {
  issued: 1250,
  used: 842,
  active: 318,
  expired: 90,
  usageRate: 67.4,
  campaigns: [
    { code: 'WELCOME2026', issued: 500, used: 320 },
    { code: 'PARKING10', issued: 300, used: 210 },
    { code: 'SERVICE20', issued: 450, used: 312 }
  ]
}

const projectPaymentConfigs: ProjectPaymentConfig[] = [
  {
    id: 'ips-central',
    project: 'IPS Central',
    feeType: 'Phí quản lý',
    paymentChannels: ['Mobile App', 'QR', 'Bank Transfer'],
    dynamicQrEnabled: true,
    provider: 'VietQR / Bank Gateway',
    status: 'active',
    lastUpdated: '13/06/2026'
  },
  {
    id: 'ips-riverside',
    project: 'IPS Riverside',
    feeType: 'Phí giữ xe',
    paymentChannels: ['QR', 'Mobile App'],
    dynamicQrEnabled: true,
    provider: 'VietQR',
    status: 'active',
    lastUpdated: '12/06/2026'
  },
  {
    id: 'ips-garden',
    project: 'IPS Garden',
    feeType: 'Phí tiện ích',
    paymentChannels: ['Bank Transfer'],
    dynamicQrEnabled: false,
    provider: 'Manual',
    status: 'needs_configuration',
    lastUpdated: '10/06/2026'
  }
]

const dynamicQrPaymentLogs: DynamicQrPaymentLog[] = [
  {
    id: 'qr-001',
    transactionCode: 'QR202606130001',
    customer: 'A1201',
    project: 'IPS Central',
    amount: 1250000,
    feeType: 'Phí quản lý',
    status: 'success',
    time: '2 phút trước'
  },
  {
    id: 'qr-002',
    transactionCode: 'QR202606130002',
    customer: 'B0908',
    project: 'IPS Riverside',
    amount: 300000,
    feeType: 'Phí giữ xe',
    status: 'pending',
    time: '5 phút trước'
  },
  {
    id: 'qr-003',
    transactionCode: 'QR202606130003',
    customer: 'C0502',
    project: 'IPS Garden',
    amount: 520000,
    feeType: 'Phí tiện ích',
    status: 'failed',
    time: '12 phút trước'
  }
]

const activityLogs: DashboardActivityLog[] = [
  {
    id: 'act-001',
    type: 'voucher_issued',
    title: 'Phát hành voucher WELCOME2026',
    description: '500 voucher được phát hành cho dự án IPS Central',
    time: '10 phút trước'
  },
  {
    id: 'act-002',
    type: 'voucher_used',
    title: 'Voucher PARKING10 đã được sử dụng',
    description: 'Căn hộ B0908 sử dụng voucher cho phí giữ xe',
    time: '18 phút trước'
  },
  {
    id: 'act-003',
    type: 'qr_created',
    title: 'Tạo QR thu phí động',
    description: 'QR thanh toán phí quản lý cho căn hộ A1201',
    time: '25 phút trước'
  },
  {
    id: 'act-004',
    type: 'payment_config_updated',
    title: 'Cập nhật cấu hình thanh toán',
    description: 'Bật QR động cho dự án IPS Riverside',
    time: '1 giờ trước'
  }
]

export const getAccessStatistics = async () => accessStatistics

export const getVoucherSummary = async () => voucherSummary

export const getProjectPaymentConfigs = async () => projectPaymentConfigs

export const getDynamicQrPaymentLogs = async () => dynamicQrPaymentLogs

export const getDashboardActivityLogs = async () => activityLogs

export const getDashboardOverview = async (): Promise<DashboardOverview> => ({
  kpis: [
    {
      id: 'visits-today',
      title: 'Lượt truy cập hôm nay',
      value: '12,480',
      subText: 'App cư dân + Admin portal',
      badge: '+8.5%',
      tone: 'primary'
    },
    {
      id: 'active-users',
      title: 'Người dùng hoạt động',
      value: '3,245',
      subText: 'Active users trong 24h',
      badge: '+4.2%',
      tone: 'success'
    },
    {
      id: 'voucher-issued',
      title: 'Voucher đã phát hành',
      value: '1,250',
      subText: 'Trong tháng hiện tại',
      badge: '+12%',
      tone: 'warning'
    },
    {
      id: 'voucher-used',
      title: 'Voucher đã sử dụng',
      value: '842',
      subText: 'Tỷ lệ sử dụng 67.4%',
      badge: '67.4%',
      tone: 'info'
    },
    {
      id: 'qr-success',
      title: 'Thanh toán QR thành công',
      value: '536',
      subText: 'Giao dịch thu phí trong ngày',
      badge: '98.1% success',
      tone: 'success'
    }
  ],
  accessStatistics,
  voucherSummary,
  projectPaymentConfigs,
  dynamicQrPaymentLogs,
  activityLogs
})
