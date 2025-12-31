export function generateParams(config: any, formData: Record<string, any>): Record<string, string> {
    const params: Record<string, string> = {};
    for (const key in config) {
        if (config[key]) {
            // Tìm giá trị tương ứng trong formData dựa trên config[key]
            const value = formData[config[key]] || '';
            if (value) {
                // Chỉ thêm vào params nếu giá trị tồn tại
                params[key] = value;
            }
        }
    }

    return params;
}
