export const getNestedValue = (obj: any, path: string): any => {
    if (!path || !obj) return 'N/A';
    
    // Nếu key phẳng tồn tại trong object, trả về giá trị trực tiếp
    if (obj[path] !== undefined) {
        return obj[path];
    }

    // Nếu không, xử lý key lồng nhau
    const keys = path.split('.');
    const value = keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

    return value !== undefined ? value : 'N/A';
};
