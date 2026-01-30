import { usePathname } from 'next/navigation';

type Locale = 'en' | 'vi';

const dictionary = {
    en: {
        'common.dashboard': 'Dashboard',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.create': 'Create',
        'common.edit': 'Edit',
        'common.search': 'Search...',
        'common.actions': 'Actions',
        'common.status': 'Status',
        'common.view': 'View',
        'api.title': 'API Management',
        'api.list': 'APIs',
        'api.create': 'New API',
        'api.spec.source': 'API Source',
        'api.spec.upload_pdf': 'Upload PDF Specification',
        'api.spec.upload_drag': 'Drag & Drop PDF file or Click to Upload',
        'api.spec.extracting': 'Extracting API Draft...',
        'api.spec.draft_title': 'Draft Specification',
        'api.spec.generate_openapi': 'Generate OpenAPI',
        'api.spec.validate': 'Validate',
        'api.spec.create_api': 'Create API from Draft',
        'product.title': 'Products',
        'product.list': 'Products',
        'app.welcome': 'Welcome to API Manager',
    },
    vi: {
        'common.dashboard': 'Tổng quan',
        'common.save': 'Lưu',
        'common.cancel': 'Hủy',
        'common.delete': 'Xóa',
        'common.create': 'Tạo mới',
        'common.edit': 'Sửa',
        'common.search': 'Tìm kiếm...',
        'common.actions': 'Thao tác',
        'common.status': 'Trạng thái',
        'common.view': 'Xem',
        'api.title': 'Quản lý API',
        'api.list': 'Danh sách API',
        'api.create': 'Tạo API mới',
        'api.spec.source': 'Nguồn API',
        'api.spec.upload_pdf': 'Tải lên đặc tả PDF',
        'api.spec.upload_drag': 'Kéo thả file PDF hoặc Nhấn để tải lên',
        'api.spec.extracting': 'Đang trích xuất bản nháp...',
        'api.spec.draft_title': 'Bản nháp đặc tả',
        'api.spec.generate_openapi': 'Tạo OpenAPI',
        'api.spec.validate': 'Kiểm tra',
        'api.spec.create_api': 'Tạo API từ bản nháp',
        'product.title': 'Sản phẩm',
        'product.list': 'Danh sách sản phẩm',
        'app.welcome': 'Chào mừng đến API Manager',
    }
};

export const getDictionary = (locale: Locale) => dictionary[locale];

export const useDictionary = () => {
    // Ideally retrieve locale from params or context, here mock for simplicity or use pathname hack
    // Assuming /en/... or /vi/...
    const pathname = usePathname();
    const locale = (pathname?.split('/')[1] as Locale) || 'en';
    const dict = dictionary[locale === 'vi' ? 'vi' : 'en'];

    const t = (key: keyof typeof dict | string) => {
        return (dict as any)[key] || key;
    };

    return { t, locale };
};
