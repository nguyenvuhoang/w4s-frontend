import type { PartnerVoucher, RedemptionHistoryItem } from './types'

export const getDemoVoucher = (token: string): PartnerVoucher => ({
  token,
  promotionName: 'Ưu đãi 20% tại ABC Coffee',
  partnerName: 'ABC Coffee',
  discountDescription: 'Giảm 20%, tối đa 50.000 ₭',
  residentName: 'Nguyễn V*** B**',
  expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  status: token.toLowerCase().includes('used') ? 'REDEEMED' : 'AVAILABLE',
  canRedeem: !token.toLowerCase().includes('used')
})

export const demoRedemptionHistory: RedemptionHistoryItem[] = [
  { id: '1', promotionName: 'Ưu đãi 20% tại ABC Coffee', residentName: 'Nguyễn V*** B**', redeemedAt: new Date(Date.now() - 1_800_000).toISOString(), outletName: 'ABC Coffee - Vientiane Center', transactionReference: 'RDM-260823-0182' },
  { id: '2', promotionName: 'Tặng một phần bánh ngọt', residentName: 'Trần T*** A**', redeemedAt: new Date(Date.now() - 7_200_000).toISOString(), outletName: 'ABC Coffee - Vientiane Center', transactionReference: 'RDM-260823-0175' }
]
