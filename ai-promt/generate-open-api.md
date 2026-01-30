You are a Senior Fullstack Engineer. Implement “Import PDF Specification → Generate OpenAPI Draft → Create API” feature inside our API Manager (Next.js 16 App Router + React 19 + TS + MUI v6 + Tailwind). Output real code file-by-file with correct paths. Keep code compact and reusable; no pseudo.

GOAL (WSO2-like):
- PDF is NOT directly executed. PDF is stored as API documentation + used to create an “ApiSpecDraft” (structured JSON) and an editable OpenAPI 3.0 draft.
- User uploads PDF spec, system extracts contract draft, generates OpenAPI YAML/JSON, user reviews/edits, validates, then “Create API” (or “Create Version”) and optionally deploys.

ROUTES/UI:
1) Enhance Create API Wizard at:
  /src/app/[locale]/(dashboard)/api-manager/apis/new
  - Step 1: Source
      options: OpenAPI file/url | WSDL file/url | PDF Spec upload (NEW)
  - Step 2: Draft & OpenAPI
      show extracted endpoints list + OpenAPI editor (textarea)
      actions: Regenerate OpenAPI, Validate
  - Step 3: Backend Connection
      upstream url, timeouts, env mapping
  - Step 4: Policies & Publish
      auth, rate limit, logging; Create API; Deploy optional

2) Add API Detail tab:
  /src/app/[locale]/(dashboard)/api-manager/apis/[apiId]
  - Add Tab “Spec”
      sections: Documentation (PDF attachments list) + Spec Draft (latest draft status) + OpenAPI snapshot per version
      actions: Upload new PDF, Generate Draft, Edit OpenAPI, Validate, Create Version from Draft

BACKEND (Next Route Handlers):
Create API routes under:
  /src/app/api/api-manager/spec/**
Required endpoints:
- POST /spec/upload         (multipart upload PDF/OpenAPI/WSDL)
- POST /spec/extract        (start draft extraction for uploaded PDF)
- GET  /spec/drafts?apiId=  (list drafts)
- GET  /spec/drafts/[id]    (draft detail)
- POST /spec/drafts/[id]/generate-openapi
- POST /spec/drafts/[id]/validate-openapi
- POST /spec/drafts/[id]/create-api        (create API from draft)
- POST /spec/drafts/[id]/create-version    (create version for existing API)

IN-MEMORY STORE (demo-ready):
- Implement singleton store in /src/server/api-manager/store.ts
- Entities:
  Api, ApiVersion, Endpoint, Policy, Environment, Route, Upstream
  ApiSpecSource(file metadata), ApiSpecDraft(status, draftJson, openApiText, validationErrors)
- Files: store pdf bytes to /tmp or /src/server/api-manager/uploads (dev only) and keep metadata in store.

PDF “LEARNING” / EXTRACTION:
- Do NOT use external APIs. For demo, implement a simple extractor:
   - parse PDF text best-effort using a local node/pdf lib if already available; if not, create a fallback:
     * store draftJson as “manual template” with placeholders,
     * allow user to paste extracted text into a textarea and click “Build Draft”.
- IMPORTANT: The system must accept a real PDF upload and move it through statuses:
   pending → processing → done/failed.
- Draft JSON structure should include:
   title, baseUrl/servers, auth requirements, endpoints[{method,path,summary,headers,query,requestSchema,responseSchemas,errorCodes}]
- OpenAPI generation:
   - generate minimal OpenAPI 3.0 valid document from draftJson
- Validation:
   - implement a lightweight validator (basic YAML/JSON parse + required fields check). No heavy libs required.

RBAC + i18n:
- Use existing RBAC perms:
  api.write api.deploy policy.write env.write
- Guard wizard actions and “Create/Deploy”.
- All UI labels via dictionary keys (EN/VN) in /src/lib/i18n.ts

UI Components (reuse):
- ApiSpecUploadCard (PDF/OpenAPI/WSDL)
- DraftStatusPanel (status, logs, retry)
- EndpointPreviewTable (from draftJson)
- OpenApiEditor (textarea + format/validate buttons)
- CreateFromDraftDialog (confirm create API/version)

DELIVERABLES:
- All new/modified files with paths.
- Minimal but working demo flow:
  Upload PDF → Extract Draft (or Paste Text → Build Draft) → Generate OpenAPI → Validate → Create API → See API detail “Spec” tab with PDF attached + OpenAPI.
- If output is too long, continue from last file without repeating prior files.
START GENERATING CODE NOW.
