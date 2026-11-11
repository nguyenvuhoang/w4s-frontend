export type DashboardKpiTone = 'success' | 'info' | 'warning' | 'primary'

export interface DashboardAccessStat {
  label: string
  mobile: number
  admin: number
}

export interface DashboardKpiCard {
  id: string
  title: string
  value: string
  subText: string
  badge: string
  tone: DashboardKpiTone
}

export interface VoucherCampaignSummary {
  code: string
  issued: number
  used: number
}

export interface VoucherSummary {
  issued: number
  used: number
  active: number
  expired: number
  usageRate: number
  campaigns: VoucherCampaignSummary[]
}

export type ProjectPaymentStatus = 'active' | 'needs_configuration' | 'paused'

export interface ProjectPaymentConfig {
  id: string
  project: string
  feeType: string
  paymentChannels: string[]
  dynamicQrEnabled: boolean
  provider: string
  status: ProjectPaymentStatus
  lastUpdated: string
}

export type DynamicQrPaymentStatus = 'success' | 'pending' | 'failed'

export interface DynamicQrPaymentLog {
  id: string
  transactionCode: string
  customer: string
  project: string
  amount: number
  feeType: string
  status: DynamicQrPaymentStatus
  time: string
}

export type DashboardActivityType =
  | 'voucher_issued'
  | 'voucher_used'
  | 'qr_created'
  | 'payment_config_updated'
  | 'payment_success'
  | 'payment_failed'

export interface DashboardActivityLog {
  id: string
  type: DashboardActivityType
  title: string
  description: string
  time: string
}

export interface DashboardOverview {
  kpis: DashboardKpiCard[]
  accessStatistics: DashboardAccessStat[]
  voucherSummary: VoucherSummary
  projectPaymentConfigs: ProjectPaymentConfig[]
  dynamicQrPaymentLogs: DynamicQrPaymentLog[]
  activityLogs: DashboardActivityLog[]
}
