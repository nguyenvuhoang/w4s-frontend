# System Service Refactoring Guide

## ✅ Completed Refactoring

### Already Refactored Files:
1. ✅ `src/app/[locale]/(dashboard)/(portal)/(nolayout)/logs/[...slug]/page.tsx`
   - Changed: `systemServiceApi.runFODynamic` → `workflowService.runFODynamic`

2. ✅ `src/views/nolayout/menu-management/hooks/useMenuManagement.ts`
   - Changed: All menu operations → `menuService`

3. ✅ `src/views/reports/index.tsx`
   - Already using `reportService.loadReport`

4. ✅ `src/views/pages/auth/ForgetPassword.tsx`
   - Already using `dataService.viewData` and `workflowService.runBODynamic`

## 📋 Files Still Using `systemServiceApi`

### Service Mapping Reference

```typescript
// Menu Operations → menuService
systemServiceApi.loadMenu → menuService.loadMenu
systemServiceApi.createMenu → menuService.createMenu
systemServiceApi.updateMenu → menuService.updateMenu
systemServiceApi.deleteMenu → menuService.deleteMenu

// Report Operations → reportService
systemServiceApi.loadReport → reportService.loadReport
systemServiceApi.loadReportDetail → reportService.loadReportDetail

// Form Operations → formService
systemServiceApi.loadFormInfo → formService.loadFormInfo
systemServiceApi.getSystemInfo → formService.getSystemInfo
systemServiceApi.updateTokenReal → formService.updateTokenReal

// Code Operations → codeService
systemServiceApi.getCdList → codeService.getCdList
systemServiceApi.getCdListFromACT → codeService.getCdListFromACT

// Data Operations → dataService
systemServiceApi.searchData → dataService.searchData
systemServiceApi.searchSystemData → dataService.searchSystemData
systemServiceApi.viewData → dataService.viewData
systemServiceApi.advanceSearchData → dataService.advanceSearchData
systemServiceApi.updateSystemData → dataService.updateSystemData

// Workflow Operations → workflowService
systemServiceApi.runBO → workflowService.runBO
systemServiceApi.runFO → workflowService.runFO
systemServiceApi.runFODynamic → workflowService.runFODynamic
systemServiceApi.runBODynamic → workflowService.runBODynamic
systemServiceApi.runDynamic → workflowService.runDynamic
```

### Remaining Files by Category

#### 1. Views - API Management (2 files)
- `src/views/api/open-api/modify/index.tsx` - Uses: `runFODynamic`
- `src/views/api/open-api/add/index.tsx` - Uses: `runFODynamic`

#### 2. Views - Menu Management (1 file)
- `src/views/nolayout/menu-management/components/MenuFormModal.tsx`

#### 3. Views - Workflow Management (3 files)
- `src/views/nolayout/workflow-management/index.tsx` - Uses: `runBODynamic`
- `src/views/nolayout/workflow-management/add-workflow-step.tsx` - Uses: `runBODynamic`
- `src/views/nolayout/workflow-management/add-workflow-definition.tsx` - Uses: `runBODynamic`

#### 4. Views - Other NoLayout (4 files)
- `src/views/nolayout/core-inbound/index.tsx`
- `src/views/nolayout/transaction-coreapi/index.tsx` - Uses: `searchSystemData`
- `src/views/nolayout/channel/index.tsx` - Uses: `runFODynamic`
- `src/views/nolayout/account-settings/change-password-form.tsx` - Uses: `runFODynamic`

#### 5. Views - Contracts (13 files)
- `src/views/contracts/contract-unblock/index.tsx` - Uses: `viewData`
- `src/views/contracts/contract-lock/index.tsx` - Uses: `viewData`, `runFODynamic`
- `src/views/contracts/contract-management-view-content/user-account.tsx` - Uses: `viewData`, `runFODynamic`
- `src/views/contracts/contract-management-view-content/bank-account.tsx` - Uses: `runFODynamic`
- `src/views/contracts/contract-management-approve-content/*.tsx` - Uses: `viewData`, `updateSystemData`
- `src/views/contracts/contract-management-modify-content/*.tsx` - Uses: `viewData`, `runFODynamic`
- `src/views/contracts/contract-management-add-content/*.tsx` - Uses: `runBODynamic`
- `src/views/contracts/agent-contract-management-add-content/*.tsx` - Uses: `runBODynamic`

#### 6. Views - Components (10 files)
- `src/views/components/render-multivalue.tsx` - Uses: `loadFormInfo`
- `src/views/components/render-pickup.tsx` - Uses: `runBODynamic`
- `src/views/components/rule/generateControlValue.ts` - Uses: `runFO`
- `src/views/components/render-same-main.tsx` - Uses: `loadFormInfo`
- `src/views/components/render-permistion-panel.tsx` - Uses: `runBODynamic`
- `src/views/components/render-lookup.tsx` - Uses: `loadFormInfo`
- `src/views/components/render-input-func.tsx` - Uses: `runFODynamic`
- `src/views/components/layout/hooks/useDynamicRenderer.ts` - Uses: `runDynamic`
- `src/views/components/layout/generate-layout.tsx` - Uses: `loadFormInfo`, `runDynamic`
- `src/views/components/console-admin/*.tsx` - Uses: Various functions

#### 7. Views - Accounting (2 files)
- `src/views/accounting/account-chart-add-content/index.tsx`
- `src/views/accounting/account-common/index.tsx`

#### 8. Views - Other (1 file)
- `src/views/ChangePassword.tsx` - Uses: `runFODynamic`

#### 9. Services (20+ files in `src/services/`)
- All handler files using `systemServiceApi`

#### 10. Components (3 files)
- `src/components/layout/SessionLayout.tsx`
- `src/components/layout/AuthorizedLayout.tsx`
- `src/components/forms/previewinfo/index.tsx`

## 🔧 Refactoring Steps

For each file, follow these steps:

### Step 1: Identify which functions are used
```bash
# Search for systemServiceApi usage in a file
grep "systemServiceApi\." <filepath>
```

### Step 2: Determine required services
Based on the functions used, import the appropriate service(s):

```typescript
// Before
import { systemServiceApi } from '@/servers/system-service'

// After - import only what you need
import { workflowService } from '@/servers/system-service'
// or multiple services
import { dataService, workflowService } from '@/servers/system-service'
```

### Step 3: Replace function calls
```typescript
// Before
systemServiceApi.runFODynamic({...})

// After
workflowService.runFODynamic({...})
```

### Step 4: Handle dynamic imports
```typescript
// Before
const { systemServiceApi } = await import('@/servers/system-service')

// After
const { workflowService } = await import('@/servers/system-service')
```

## 🎯 Quick Refactor Commands

### Find all files still using systemServiceApi:
```bash
grep -r "systemServiceApi" src/ --include="*.tsx" --include="*.ts"
```

### Replace in a single file:
Use VS Code's Find & Replace (Ctrl+H) with case sensitivity on:
- Find: `systemServiceApi.runFODynamic`
- Replace: `workflowService.runFODynamic`

### Batch replace for similar patterns:
Use multi_replace_string_in_file tool for files with multiple replacements.

## 📊 Progress Tracking

Total files using `systemServiceApi`: ~80+ files
- ✅ Completed: 4 files
- 🔄 In Progress: 0 files
- ⏳ Remaining: ~76 files

Estimated time: 2-3 hours for complete refactoring (if doing manually)

## 💡 Tips

1. **Start with high-impact files**: Components and services used frequently
2. **Test after each batch**: Ensure no breakage
3. **Use search tools**: Leverage VS Code's global search
4. **Group by service type**: Refactor all workflow files together, then all data files, etc.
5. **Backward compatibility**: The old `systemServiceApi` still works, so you can refactor gradually

## 🚀 Recommended Order

1. ✅ Core navigation & auth (Done)
2. Service hooks (`src/services/*`) - These are used by many views
3. Common components (`src/views/components/*`)
4. Business logic views (contracts, accounting, etc.)
5. Admin/management views
6. Layout components

## ⚠️ Important Notes

- The old `systemServiceApi` is marked as `@deprecated` but still works
- All existing functionality remains unchanged
- This refactoring improves code organization and bundle size (tree-shaking)
- No API behavior changes, only import changes
