import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const draft = store.drafts.find(d => d.id === id);

    if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Simulate extraction process
    draft.status = 'PROCESSING';

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // MOCK: Force return the Banking Spec for demo purposes
    // In a real system, this would be the result of parsing the PDF
    draft.extractedJson = {
        "title": "LMPS Banking Payment Integration (RTGS/Interbank)",
        "version": "1.0.0",
        "description": "Simulated specification for High-Value Payment System integration. Includes both Inbound (callbacks/requests from Bank) and Outbound (requests to Bank) interfaces.",
        "sourceType": "PDF_SIMULATION",
        "assumptions": [
            "Security: mTLS + JWS Signature required for all endpoints.",
            "Idempotency: requestId header is mandatory.",
            "Async Flow: Transfers are processed asynchronously; final status delivered via webhook."
        ],
        "baseUrl": "https://api.banking-partner.com/gateway/v1",
        "incoming_webhooks": [
            {
                "name": "Payment Status Notify",
                "method": "POST",
                "path": "/webhooks/payments/status",
                "summary": "Bank notifies system of final transaction status (Success/Reject)",
                "payload_schema": {
                    "transactionRef": "string",
                    "bankRef": "string",
                    "status": "string (SUCCESS|FAILED|PENDING)",
                    "reasonCode": "string",
                    "timestamp": "iso8601"
                }
            }
        ],
        "endpoints": [
            {
                "tag": "Outbound Transfer",
                "method": "POST",
                "path": "/payments/transfer",
                "summary": "Initiate Interbank Transfer (RTGS)",
                "description": "Request to move funds from our account to a beneficiary at another bank.",
                "headers": [
                    { "name": "X-Request-ID", "required": true, "description": "Unique UUID for idempotency" },
                    { "name": "X-Signature", "required": true, "description": "JWS Signature of payload" }
                ],
                "requestSchema": {
                    "type": "object",
                    "properties": {
                        "amount": { "type": "number", "format": "decimal", "example": 1000000 },
                        "currency": { "type": "string", "example": "VND" },
                        "debtorAccount": { "type": "string", "description": "Source Account" },
                        "creditorAccount": { "type": "string", "description": "Beneficiary Account" },
                        "creditorBankCode": { "type": "string", "description": "CITAD/Bank Code" },
                        "remark": { "type": "string", "maxLength": 200 }
                    },
                    "required": ["amount", "currency", "debtorAccount", "creditorAccount", "creditorBankCode"]
                },
                "responseSchemas": {
                    "200": {
                        "description": "Request Accepted for Processing",
                        "properties": {
                            "ackId": { "type": "string" },
                            "status": { "type": "string", "example": "PROCESSING" }
                        }
                    },
                    "400": { "description": "Validation Error" },
                    "500": { "description": "Bank Gateway Error" }
                }
            },
            {
                "tag": "Inquiry",
                "method": "POST",
                "path": "/accounts/inquiry",
                "summary": "Query Benificiary Account Name",
                "description": "Verify account existence and name at beneficiary bank before transfer.",
                "requestSchema": {
                    "type": "object",
                    "properties": {
                        "accountNumber": { "type": "string" },
                        "bankCode": { "type": "string" }
                    },
                    "required": ["accountNumber", "bankCode"]
                },
                "responseSchemas": {
                    "200": {
                        "properties": {
                            "accountName": { "type": "string" },
                            "status": { "type": "string", "example": "ACTIVE" }
                        }
                    }
                }
            },
            {
                "tag": "Reconciliation",
                "method": "POST",
                "path": "/reconciliation/statement",
                "summary": "Download Daily Statement",
                "description": "Request EOD statement for reconciliation.",
                "requestSchema": {
                    "type": "object",
                    "properties": {
                        "date": { "type": "string", "format": "date" },
                        "accountNumber": { "type": "string" }
                    }
                },
                "responseSchemas": {
                    "200": {
                        "description": "Statement File Content (Base64)",
                        "properties": { "content": { "type": "string" } }
                    }
                }
            }
        ]
    };

    draft.title = draft.extractedJson.title;
    draft.status = 'DONE';

    return NextResponse.json(draft);
}
