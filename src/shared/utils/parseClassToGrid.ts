export const parseClassToGrid = (classString: string) => {
    const gridProps: Record<string, number> = {};
    const classList = classString.split(' ');

    classList.forEach((cls) => {
        if (cls.startsWith('col-')) {
            const parts = cls.split('-'); // Tách chuỗi theo dấu "-"
            if (parts.length === 2) {
                // Trường hợp chỉ có "col-12"
                const value = parseInt(parts[1], 10);
                if (value) {
                    gridProps['xs'] = value;
                    gridProps['sm'] = value;
                    gridProps['md'] = value;
                    gridProps['lg'] = value;
                    gridProps['xl'] = value;
                }
            } else if (parts.length === 3) {
                const breakpoint = parts[1]; // sm, md, lg, xl
                const value = parseInt(parts[2], 10);
                if (breakpoint && value) {
                    gridProps[breakpoint] = value; // Gán giá trị vào object
                }
            }
        }
    });

    return gridProps;
};
