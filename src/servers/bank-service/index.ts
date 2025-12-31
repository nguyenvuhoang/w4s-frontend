import { AccountDetailResponse, AccountHistoryInfoResponse, BalanceDetailResponse, BankDataResponse, BankInfoResponse, BenificiaryInfoResponse, BenificiaryListResponse, CardByIDResponse, CardListResponse, FavoriteFeatureOfUser, FundTransferDataRequest, ListFavoriteFeature, LoanProductResponse, PointOfUserResponse, SavingProductResponse, TemplateTransferResponse, UpdateFavoriteFeatureOfUserResponse } from "@/types/bankType"
import { SystemDataRequest } from "@/types/systemTypes"
import http from "../lib/http"

export const bankServiceApi = {

    getAccountInfo: ({ sessiontoken, language }: SystemDataRequest) =>
        http.post<BankDataResponse>('/bank-service',
            {
                bo: [
                    {
                        "app": "IB",
                        "input": {
                            "applicationcode": "DIGITAL",
                            "learn_api": "DPT_INFO"
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: '89'
                }
            }),
    getBalance: ({ accountnumber, accountype, sessiontoken, language, transactionreference }:
        {
            accountnumber: string,
            accountype: string,
            sessiontoken: string,
            language: string
            transactionreference: string
        }) =>
        http.post<BalanceDetailResponse>('/bank-service',
            {

                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "DPT_GET_BALANCE",
                            accountnumber: `${accountnumber}`,
                            transactionreference: transactionreference,
                            accounttype: accountype,
                            description: 'Lấy thông tin số dư tài khoản'
                        }
                    }
                ]

            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: '89'
                }
            }),
    getAccountDetail: ({ sessiontoken, accountnumber, language }:
        {
            sessiontoken: string,
            accountnumber: string,
            language: string
        }) =>
        http.post<AccountDetailResponse>('/bank-service',
            {

                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "DPT_ACCOUNT_DETAIL",
                            accountnumber: `${accountnumber}`,
                        }
                    }
                ]

            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: '89'
                }
            }),

    getBankList: ({ sessiontoken, language }:
        {
            sessiontoken: string,
            language: string
        }) =>
        http.post<BankInfoResponse>('/bank-service',
            {
                bo: [
                    {
                        "app": "IB",
                        "input": {
                            "learn_api": "D_BANK"
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: '89'
                }
            }),
    getTransferTemplate: ({ sessiontoken }:
        {
            sessiontoken: string,
        }) =>
        http.post<TemplateTransferResponse>('/bank-service',
            {
                bo: [
                    {
                        "app": "IB",
                        "input": {
                            applicationcode: "DIGITAL",
                            learn_api: "D_TEMPLATETRANSFER_INFO"
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: '89'
                }
            }),

    getBeneficiaryList: ({ sessiontoken }:
        {
            sessiontoken: string,
        }) =>
        http.post<BenificiaryListResponse>('/bank-service',
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "D_RECEIVERLIST_INFO"
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: '89'
                }
            }),
    getCreditProduct: ({ sessiontoken, language }:
        {
            sessiontoken: string,
            language: string
        }) =>
        http.post<LoanProductResponse>('/bank-service',
            {

                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "GET_ALL_DATA_LOAN_PRODUCT",
                            language: `${language}`,
                        }
                    }
                ]

            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: '89'
                }
            }),
    getCardList: ({ sessiontoken, language }:
        {
            sessiontoken: string,
            language: string
        }) =>
        http.post<CardListResponse>('/bank-service',
            {

                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "GET_ALL_DATA_CARD_USER_BY_USER_CODE",
                            language: `${language}`,
                        }
                    }
                ]

            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: '89'
                }
            }),

    getCardUserByID: ({ sessiontoken, language, id }:
        {
            sessiontoken: string,
            language: string,
            id: string,

        }) =>
        http.post<CardByIDResponse>('/bank-service',
            {

                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "VIEW_CARD_USER_BY_ID",
                            language: `${language}`,
                            id: id,
                        }
                    }
                ]

            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    id: '',
                    app: '89'
                }
            }),
    verifyAccount: ({ sessiontoken, accountnumber, bankcode }:
        {
            sessiontoken: string,
            accountnumber: string,
            bankcode: string
        }) =>
        http.post<BenificiaryInfoResponse>('/bank-service',
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "IB_VERIFY_ACCOUNT",
                            accountnumber: accountnumber,
                            bankcode: bankcode
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: '89'
                }
            }),

    getAccountHistory: ({ sessiontoken, accountnumber, fromdate, todate }:
        {
            sessiontoken: string,
            accountnumber: string,
            fromdate: string
            todate: string
        }) =>
        http.post<AccountHistoryInfoResponse>('/bank-service',
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "DPT_HIS",
                            accountnumber: accountnumber,
                            fromdate: fromdate,
                            todate: todate,
                            description: `IB Get Account History  ${accountnumber}`
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: '89'
                }
            }),

    getFavoritefeatureOfUser: ({ sessiontoken }:
        {
            sessiontoken: string
        }) =>
        http.post<FavoriteFeatureOfUser>('/bank-service',
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "INFO_FAVORITEFEATURE_OF_USERCODE"
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: '89'
                }
            }),

    getListFavorite: ({ sessiontoken }:
        {
            sessiontoken: string
        }) =>
        http.post<ListFavoriteFeature>('/bank-service',
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "INFO_FAVORITEFEATURE_MERGE_USER_CHOOSEN"
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: '89'
                }
            }),


    updateFavoriteFeatureOfUser: ({ sessiontoken, body }:
        {
            sessiontoken: string
            body: any
        }) =>
        http.post<UpdateFavoriteFeatureOfUserResponse>('/bank-service',
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "INSERT_USERFAVORITEFEATURES_CHOSE",
                            favoriteitems: body
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: '89'
                }
            }),


    getAllSavingProduct: ({ sessiontoken, language }: SystemDataRequest
    ) =>
        http.post<SavingProductResponse>(
            "/bank-service",
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "GET_ALL_DATA_SAVING_PRODUCT",

                        },
                    },
                ],
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: "89",
                    lang: language,

                },
            }
        ),
    FundTransfer: ({
        from_account_number,
        to_account_number,
        amount,
        fee_deposit_tranfer_amount,
        transaction_reference,
        description,
        sessiontoken,
        language
    }: FundTransferDataRequest
    ) =>
        http.post<SavingProductResponse>(
            "/bank-service",
            {
                bo: [
                    {
                        app: "IB",
                        input: {
                            applicationcode: "DIGITAL",
                            learn_api: "DPT_DPT",
                            from_account_number: from_account_number,
                            to_account_number: to_account_number,
                            amount: amount,
                            fee_deposit_tranfer_amount: fee_deposit_tranfer_amount,
                            transaction_reference: transaction_reference,
                            description: description,
                        },
                    },
                ],
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: "89",
                    lang: language,

                },
            }
        ),

        getPointOfUser: ({ sessiontoken, language }: SystemDataRequest) =>
            http.post<PointOfUserResponse>('/bank-service',
                {
                    bo: [
                        {
                            "app": "IB",
                            "input": {
                                "applicationcode": "DIGITAL",
                                "learn_api": "D_USER_REWARD_POINT"
                            }
                        }
                    ]
                },
                {
                    baseUrl: process.env.NEXT_PUBLIC_API_URL,
                    headers: {
                        uid: `${sessiontoken}`,
                        lang: language,
                        app: '89'
                    }
                }),
}
