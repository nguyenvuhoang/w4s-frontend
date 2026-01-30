Analyze the attached PDF API specification.

From this PDF:
1) Extract API contracts (endpoints, methods, request/response fields, headers, auth, error rules).
2) Create a structured ApiSpecDraft (JSON) representing the contract.
3) Generate an OpenAPI 3.0 draft (YAML) from that draft.
4) Identify:
   - Outgoing APIs (we call external system)
   - Incoming APIs / webhooks (external system calls us)
5) Identify security/signature requirements and express them as reusable API policies.
6) Identify retry, reconciliation, and business rules (e.g. should-revert, status-check flows).

Output:
- ApiSpecDraft JSON
- OpenAPI 3.0 YAML (minimal but valid)
- Notes on required policies and workflows

Do not write application code yet.
