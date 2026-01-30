# Analysis of LMPS Banking Interface (Simulation)

## 1. Executive Summary
This document analyzes the simulated **Liquidity Management & Payment System (LMPS)** interface. The API follows a standard **Asynchronous Command Pattern** typical for high-value banking systems (RTGS/CITAD).

## 2. API Contract Structure
The system requires two distinct API sets:
1.  **Outbound API (Client Mode)**: We call the Bank's Gateway.
    -   `POST /transfer`: Initiate fund movement.
    -   `POST /inquiry`: Validation checks.
2.  **Inbound API (Server Mode)**: The Bank calls our Gateway (Webhook).
    -   `POST /receive-status`: Final confirmation of async transfers.

## 3. Top Security Requirements (Policies)
To implement this safely in API Manager, the following policies must be attached:

| Policy Type | Direction | Configuration Detail |
| :--- | :--- | :--- |
| **Mutual TLS (mTLS)** | Outbound | Client Certificate must be presented to Bank. |
| **JWS / Signature** | Outbound | `X-Signature` header must be generated using our Private Key. |
| **IP Whitelisting** | Inbound | Allow requests ONLY from Bank CIDR ranges. |
| **Signature Verify** | Inbound | Verify `X-Signature` using Bank's Public Key. |

## 4. Workflows & Resilience
-   **Timeout Handling**: RTGS transactions can take seconds to minutes. Do NOT rely on HTTP Response for final status.
    -   *Logic*: If HTTP 200 OK received → Status = `PENDING`. Wait for Webhook.
    -   *Logic*: If HTTP Timeout/500 → Status = `UNKNOWN`. Initiate `CheckStatus` enquiry job (Reconciliation).
-   **Idempotency**: Every `POST /transfer` MUST have a unique `X-Request-ID`. Retrying a timeout request must use the SAME ID.

## 5. Next Steps for Implementation
1.  Import `lmps-openapi.yaml` into API Manager.
2.  Configure "Upstream" to point to the Bank's Sandbox URL.
3.  Create a "Status Callback" API in API Manager to proxy the webhook to our internal backend.
