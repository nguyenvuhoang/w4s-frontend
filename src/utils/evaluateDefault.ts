export const evaluateDefault = (defaultValue: string): any => {
    const match = defaultValue.match(/new Date\(\)\s*\+\s*(\d+)\s*years/);
    if (match) {
        const yearsToAdd = parseInt(match[1], 10); // Lấy số năm từ chuỗi
        const currentDate = new Date();
        currentDate.setFullYear(currentDate.getFullYear() + yearsToAdd);
        return currentDate;
    }
    try {
        return new Function(`return ${defaultValue}`)();
    } catch {
        return ""; 
    }
};
