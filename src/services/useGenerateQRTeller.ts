'use client'

import { useCallback, useRef, useState } from 'react'
import { isValidResponse } from '@/utils/isValidResponse'
import { qrServiceApi } from '@/servers/qr-service'
import { systemServiceApi } from '@/servers/system-service'
import QRCode from 'qrcode'
import { toPng } from 'html-to-image'
import { Locale } from '@/configs/i18n'
import { Session } from 'next-auth'
import SwalAlert from '@/utils/SwalAlert'

type Dict = Record<string, any>

export const useGenerateQRTeller = ({
    sessionToken,
    locale,
    dictionary,
}: {
    sessionToken?: string
    locale: Locale
    dictionary: Dict
}) => {
    // form state
    const [transaction, setTransaction] = useState('')
    const [accountNumber, setAccountNumber] = useState('')

    // ui state
    const [qrCode, setQrCode] = useState('')
    const [accountName, setAccountName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [txnError, setTxnError] = useState('')
    const [acctError, setAcctError] = useState('')

    // ref cho vùng cần export ảnh (toàn khung)
    const frameRef = useRef<HTMLDivElement | null>(null)

    // helpers
    const getBankInfo = useCallback(async (bankcode: string) => {
        try {
            const res = await systemServiceApi.viewData({
                sessiontoken: sessionToken as string,
                workflowid: 'DTS_EXECUTE_SQL',
                commandname: 'viewbankinfo',
                issearch: false,
                parameters: { id: bankcode },
            })

            if (!isValidResponse(res) || res.payload?.dataresponse?.error?.length) {
                console.log(
                    'ExecutionID:',
                    res.payload?.dataresponse?.error?.[0]?.execute_id,
                    '-',
                    res.payload?.dataresponse?.error?.[0]?.info
                )
            }

            return res.payload.dataresponse.fo[0].input.data[0]
        } catch (e) {
            console.error('getBankInfo error:', e)
            return null
        }
    }, [sessionToken])

    const generateQR = useCallback(async () => {
        // clear lỗi cũ
        setTxnError('')
        setAcctError('')
        setError('')

        const acct = accountNumber.trim()

        // validate
        if (!acct) setAcctError(dictionary['QR']?.account_required || 'Account number is required.')
        if (!transaction) setTxnError(dictionary['QR']?.transaction_required || 'Please select a transaction.')
        if (!acct || !transaction) return

        setIsLoading(true)
        try {
            const bank = await getBankInfo('EMI')

            const qrApi = await qrServiceApi.GenerateQRCode({
                sessiontoken: sessionToken as string,
                language: locale,
                transactioncode: transaction,
                accountnumber: acct,
                currencyCode: '704',
                bankInfo: {
                    bankcode: bank?.bankcodev,
                    countrycode: bank?.countrycode ?? 'LA',
                    bin: bank?.bin
                },
            })

            if (!isValidResponse(qrApi) || qrApi.payload?.dataresponse?.error?.length) {
                console.log(
                    'ExecutionID:',
                    qrApi.payload?.dataresponse?.error?.[0]?.execute_id,
                    '-',
                    qrApi.payload?.dataresponse?.error?.[0]?.info
                )
                setError(dictionary['QR'].errorgenqr)
                return
            }

            const { qr_content, customername } = qrApi.payload.dataresponse.fo[0].input
            setAccountName(customername || '')

            const qrDataUrl = await QRCode.toDataURL(qr_content, { width: 300, margin: 1 })
            setQrCode(qrDataUrl)
        } catch (e) {
            console.error(e)
            setError(dictionary['QR'].errorgenqr)
        } finally {
            setIsLoading(false)
        }
    }, [accountNumber, dictionary, getBankInfo, locale, sessionToken, transaction])

    const sendEmail = useCallback(async () => {
        if (!qrCode) return
        setIsLoading(true)
        try {

            SwalAlert('Success', dictionary['QR'].emailsent, 'center')
        } catch (e) {
            setError(dictionary['QR'].emailerror)
        } finally {
            setIsLoading(false)
        }
    }, [accountNumber, dictionary, qrCode])

    const downloadFramePng = useCallback(async () => {
        const node = frameRef.current
        if (!node) return
        try {
            const dataUrl = await toPng(node, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                cacheBust: true,
            })
            const a = document.createElement('a')
            a.href = dataUrl
            a.download = `QR_${accountNumber || 'generated'}.png`
            a.click()
        } catch (e) {
            console.error('Download failed:', e)
        }
    }, [accountNumber])

    // handlers to clear error on change
    const onChangeTransaction = (v: string) => {
        setTransaction(v)
        setTxnError('')
    }
    const onChangeAccountNumber = (v: string) => {
        setAccountNumber(v)
        setAcctError('')
    }

    return {
        // state
        transaction, accountNumber, qrCode, accountName,
        isLoading, error, txnError, acctError,
        // refs
        frameRef,
        // actions
        generateQR, sendEmail, downloadFramePng,
        // change handlers
        onChangeTransaction, onChangeAccountNumber,
        // setters if cần dùng thêm
        setTransaction, setAccountNumber, setQrCode,
    }
}
