export type VoucherStatus = 'AVAILABLE' | 'REDEEMED' | 'EXPIRED' | 'INVALID'

export type PartnerVoucher = {
  token: string
  promotionName: string
  partnerName: string
  discountDescription: string
  residentName: string
  expiresAt: string
  status: VoucherStatus
  canRedeem: boolean
}

export type RedemptionHistoryItem = {
  id: string
  promotionName: string
  residentName: string
  redeemedAt: string
  outletName: string
  transactionReference: string
}

export type PartnerApiResult<T> = { success: boolean; data?: T; message?: string; executionId?: string }
