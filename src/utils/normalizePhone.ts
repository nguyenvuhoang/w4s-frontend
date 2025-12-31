export const normalizePhone = (tel: string) => {
    if (!tel) return '';

    // Loại bỏ khoảng trắng và ký tự không số
    let clean = tel.replace(/\s+/g, '').trim();

    // Nếu bắt đầu bằng +84 hoặc 84 → thay bằng 0
    if (clean.startsWith('+84')) clean = '0' + clean.slice(3);
    else if (clean.startsWith('84')) clean = '0' + clean.slice(2);

    // Nếu bắt đầu bằng +856 hoặc 856 → thay bằng 0
    else if (clean.startsWith('+856')) clean = '0' + clean.slice(4);
    else if (clean.startsWith('856')) clean = '0' + clean.slice(3);

    return clean;
};
