// 🛠 Helpers
export const toDateInput = (v: any) => {
    if (!v) return '';
    if (typeof v === 'string') {
        // Lấy "YYYY-MM-DD" từ "YYYY-MM-DDTHH:mm:ss(.sss)"
        const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : '';
    }
    try {
        return new Date(v).toISOString().slice(0, 10);
    } catch {
        return '';
    }
};
