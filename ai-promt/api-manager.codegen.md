Bạn là Senior Frontend Architect. Hãy GENERATE CODE đầy đủ cho module “API Manager” enterprise-grade theo stack:
Next.js 16 App Router + React 19 + TypeScript + MUI v6 + TailwindCSS.
Yêu cầu chạy demo ngay với mock data (in-memory). Không hỏi lại.

OUTPUT: trả về code theo từng file (đường dẫn + nội dung). Không pseudo.

ROUTES (i18n):
/src/app/[locale]/(dashboard)/api-manager
- /overview
- /apis
- /apis/new (wizard 3 bước)
- /apis/[apiId] (tabs: overview, versions, endpoints, policies, analytics, logs, deployments)
- /products
- /products/[productId]
- /subscriptions
- /subscriptions/[subscriptionId]
- /consumers
- /consumers/[consumerId]
- /credentials (api keys + oauth clients)
- /policies (library + attach)
- /gateway/routes
- /gateway/upstreams
- /quota (rate limit & quota rules)
- /analytics
- /logs
- /environments
- /settings

KIẾN TRÚC:
- Page (server component) fetch data từ Route Handlers: /src/app/api/api-manager/**
- UI tables/dialogs/drawers là client component trong /src/components/api-manager/**
- Shared UI: PageHeader, Breadcrumbs, FilterBar, StatsCard, ConfirmDialog, DrawerDetail, EmptyState, ErrorState.
- Dùng MUI Table (+ TablePagination) + sort/search/filter. (Không dùng redux, không lib ngoài.)
- Tailwind chỉ dùng layout/spacing nhanh (p-*, gap-*, flex, grid). MUI dùng cho component.

RBAC:
- roles: Admin | Operator | Viewer
- permissions: api.read api.write api.deploy product.read product.write subscription.read subscription.manage consumer.read consumer.write credential.manage policy.write logs.read analytics.read env.write settings.write
- Implement guard: <RequirePermission perm="..."> cho page/action (hide/disable).
- Mock current user in server: role=Admin (dễ đổi).

I18N:
- /src/lib/i18n.ts: dictionary EN/VN + hook useDictionary(locale).
- Tất cả title/label dùng dict key (không hardcode string).

MOCK DATA MODELS (types):
API, ApiVersion, Endpoint, ProductPlan, Subscription, Consumer, ApiKey, OAuthClient, Policy, Route, Upstream, QuotaRule, LogItem, AnalyticsPoint, Environment.
CRUD cơ bản qua route handlers (GET list, GET detail, POST create, PUT update, DELETE optional).
In-memory store đặt tại /src/server/api-manager/store.ts (singleton), thread-safe đơn giản.

UI REQUIREMENTS:
- Dashboard Layout (sidebar + topbar) đã có API Manager section. Nếu chưa có thì tạo minimal layout trong (dashboard).
- Overview page: KPI cards + top lists (mock).
- List screens: search + filters + pagination + row actions menu (View/Edit/Delete/Deploy tuỳ quyền).
- Detail screens: header + tabs + actions.
- API Create Wizard 3 steps: Basic -> Endpoints -> Policies, validate tối thiểu.
- Logs page: advanced filter (api, status, time range), row click mở Drawer detail.
- Analytics page: không dùng chart lib; hiển thị bảng timeseries + stats summary.
- Policies: library list + policy editor (JSON text area) + attach dialog (attach to API/version/endpoint).
- Gateway: Routes & Upstreams list + create dialog.
- Quota: rule list + assign to product/subscription.
- Environments: list + env variables (mask secrets label only).
- Settings: global settings form + audit log viewer (mock).

CODING RULES:
- Mỗi page: loading.tsx + error.tsx khi hợp lý.
- Fetch helpers: /src/server/api-manager/client.ts (wrap fetch + typed).
- Use “use client” đúng chỗ. Server pages không import client-only hooks.
- Tối ưu token: code gọn, tái sử dụng component; không tạo quá nhiều file rác.
- Nhưng vẫn phải đủ các screens/route stub hoạt động.

BẮT ĐẦU: tạo full code file-by-file.
