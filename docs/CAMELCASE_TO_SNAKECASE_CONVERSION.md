# CamelCase to Snake_Case Conversion Implementation

## Overview
Implemented automatic conversion of object keys from camelCase to snake_case before sending data to API endpoints. This ensures API requests follow the correct naming convention.

## Files Created

### 1. `src/shared/utils/convertKeysToSnakeCase.ts`
Utility function that provides:
- `camelToSnakeCase(str)` - Converts a single string from camelCase to snake_case
- `convertKeysToSnakeCase(obj)` - Recursively converts all object keys from camelCase to snake_case
  - Handles nested objects and arrays
  - Preserves values as-is

Example:
```typescript
// Input
{
  WorkflowId: "WF_BO_LOS_LOGIN",
  WorkflowName: "LOS Login",
  IsReverse: false,
  TimeOut: 60000
}

// Output
{
  workflow_id: "WF_BO_LOS_LOGIN",
  workflow_name: "LOS Login",
  is_reverse: false,
  time_out: 60000
}
```

## Files Updated

### 1. `src/views/nolayout/workflow-management/useAddWorkflowDefinition.ts`
- Added import for `convertKeysToSnakeCase`
- Updated `handleSave()` to convert `wfDefData` keys before submission:
  ```typescript
  fields: convertKeysToSnakeCase(wfDefData)
  ```

### 2. `src/views/nolayout/workflow-management/useAddWorkflowStep.ts`
- Added import for `convertKeysToSnakeCase`
- Updated workflow step form submission to convert keys:
  ```typescript
  fields: { wfstep: convertKeysToSnakeCase(form) }
  ```

### 3. `src/views/nolayout/workflow-management/index.tsx`
- Added import for `convertKeysToSnakeCase`
- Updated 4 functions to convert keys:
  - `updateWfDef()` - Converts wfDef object
  - `updateWfStep()` - Converts wfStep object
  - `deleteWfDef()` - Converts selectedWfDef array
  - `deleteWfStep()` - Converts selectedWfStep array

## Usage Pattern

When submitting form data with camelCase keys to API:

```typescript
// Before (incorrect format)
fields: { wfstep: form }

// After (correct format)
fields: { wfstep: convertKeysToSnakeCase(form) }
```

## Benefits

1. **Consistency** - All API requests use snake_case naming
2. **Type Safety** - Frontend can use camelCase (TypeScript convention) while backend receives snake_case
3. **Reusability** - Single utility function handles all conversions
4. **Nested Support** - Automatically handles nested objects and arrays

## Future Enhancements

Consider applying this pattern to:
- Menu management operations
- Accounting operations  
- Other forms that submit camelCase data to API endpoints

The utility function is generic and can be used anywhere camelCase to snake_case conversion is needed.
