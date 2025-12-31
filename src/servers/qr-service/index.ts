import { env } from "@/env.mjs";
import { RequestDataDefault } from "@/types";
import { FODataResponse } from "@/types/systemTypes";
import { apiPost, createDefaultBody } from "../lib/api";

export const qrServiceApi = {
    GenerateQRCode: ({ sessiontoken, language, transactioncode, accountnumber, currencyCode, bankInfo }: RequestDataDefault) =>
        apiPost<FODataResponse>('/system-service',
            createDefaultBody("BO_GENERATE_QR_PAYMENT",
                {
                    name: transactioncode,
                    account_number: accountnumber,
                    bank_code: bankInfo.bankcode,
                    country_code: bankInfo.countrycode,
                    currency_code: currencyCode,
                    guid: bankInfo.bin,
                    qrtype: "TRANSFER",
                    is_digital: true
                }
            ),
            sessiontoken as string,
            {
                lang: language as string,
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS',
            },

        ),

}
