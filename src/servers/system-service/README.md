# System Service Structure

## Overview
System service được tổ chức lại theo các module chức năng để dễ bảo trì và mở rộng.

## Folder Structure

```
src/servers/system-service/
├── index.ts                      # Main entry point, exports all services
└── services/
    ├── menu.service.ts           # Menu operations
    ├── form.service.ts           # Form & system info operations
    ├── code.service.ts           # Code list operations
    ├── data.service.ts           # Search, view & update operations
    ├── workflow.service.ts       # BO/FO workflow operations
    └── report.service.ts         # Report operations
```

## Service Modules

### 1. Menu Service (`menu.service.ts`)
Quản lý các thao tác liên quan đến menu:
- `loadMenu()` - Tải danh sách menu với phân trang
- `createMenu()` - Tạo menu mới
- `updateMenu()` - Cập nhật menu
- `deleteMenu()` - Xóa menu

### 2. Form Service (`form.service.ts`)
Quản lý form và thông tin hệ thống:
- `loadFormInfo()` - Tải thông tin form theo formid
- `getSystemInfo()` - Lấy thông tin hệ thống
- `updateTokenReal()` - Cập nhật token real

### 3. Code Service (`code.service.ts`)
Quản lý danh sách mã code:
- `getCdList()` - Lấy danh sách code theo code group và code name
- `getCdListFromACT()` - Lấy danh sách code từ Active Code Table

### 4. Data Service (`data.service.ts`)
Quản lý các thao tác tìm kiếm, xem và cập nhật dữ liệu:
- `searchData()` - Tìm kiếm dữ liệu với phân trang
- `searchSystemData()` - Tìm kiếm dữ liệu hệ thống
- `viewData()` - Xem chi tiết dữ liệu
- `advanceSearchData()` - Tìm kiếm nâng cao
- `updateSystemData()` - Cập nhật dữ liệu hệ thống

**Optimizations:**
- Validation cho `commandname` để tránh gọi API không cần thiết
- Console warning khi có lỗi validation

### 5. Workflow Service (`workflow.service.ts`)
Quản lý các thao tác workflow BO/FO:
- `runBO()` - Chạy Business Object operation
- `runFO()` - Chạy Function Object operation
- `runFODynamic()` - Chạy FO với dynamic input
- `runBODynamic()` - Chạy BO với dynamic transaction
- `runDynamic()` - Chạy workflow với custom body

**Optimizations:**
- Validation cho `commandname` khi `issearch=true`

### 6. Report Service (`report.service.ts`)
Quản lý các thao tác liên quan đến báo cáo:
- `loadReport()` - Tải danh sách báo cáo
- `loadReportDetail()` - Tải chi tiết báo cáo

## Usage

### Legacy Way (Backward Compatible)
```typescript
import { systemServiceApi } from '@/servers/system-service'

// Sử dụng như cũ
systemServiceApi.loadMenu(...)
systemServiceApi.searchData(...)
```

### Recommended Way (Modular)
```typescript
// Import chỉ service cần dùng
import { menuService } from '@/servers/system-service/services/menu.service'
import { dataService } from '@/servers/system-service/services/data.service'

// Sử dụng
menuService.loadMenu(...)
dataService.searchData(...)
```

hoặc:

```typescript
// Import từ index nếu muốn
import { menuService, dataService } from '@/servers/system-service'

menuService.loadMenu(...)
dataService.searchData(...)
```

## Benefits

1. **Tổ chức tốt hơn**: Mỗi service module có một trách nhiệm rõ ràng
2. **Dễ bảo trì**: Dễ tìm và sửa code khi cần
3. **Tree-shaking**: Chỉ import những gì cần dùng, giảm bundle size
4. **Scalability**: Dễ dàng thêm service mới khi cần
5. **Documentation**: Mỗi service có JSDoc comments giải thích rõ ràng
6. **Validation**: Các hàm quan trọng đã được thêm validation để tránh lỗi
7. **Backward Compatible**: Code cũ vẫn hoạt động bình thường

## Migration Guide

Không cần migration ngay lập tức. Code cũ vẫn hoạt động:
```typescript
// Vẫn work
import { systemServiceApi } from '@/servers/system-service'
systemServiceApi.loadMenu(...)
```

Khi refactor, có thể chuyển sang dùng service riêng lẻ:
```typescript
// Recommended
import { menuService } from '@/servers/system-service'
menuService.loadMenu(...)
```
