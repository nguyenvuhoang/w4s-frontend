export function replaceAtFields(data: any, params: Record<string, string>): any {
    if (!params || Object.keys(params).length === 0) {
        return data;
    }
    if (Array.isArray(data)) {
        // Nếu data là mảng, duyệt từng phần tử
        return data.map(item => replaceAtFields(item, params));
    } else if (typeof data === 'object' && data !== null) {
        // Nếu data là object, duyệt qua các key-value
        const updatedObject: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string' && value.startsWith('@')) {
                // Thay thế nếu value bắt đầu bằng "@" và có parameter tương ứng
                const paramKey = value.substring(1); // Bỏ ký tự "@"
                if (params[paramKey] !== undefined) {
                    updatedObject[key] = params[paramKey]; // Thay thế bằng giá trị parameter
                } else {
                    updatedObject[key] = value; // Giữ nguyên giá trị ban đầu
                }
            } else {
                // Gọi đệ quy nếu value là object hoặc mảng
                updatedObject[key] = replaceAtFields(value, params);
            }
        }
        return updatedObject;
    }
    return data; // Trả về giá trị không cần xử lý
}
