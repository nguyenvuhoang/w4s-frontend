export const generatePathNameView = (id: any, currentPath: string, data: any, pathname?: string) => {
    const formview = data[0].formview;
    const pathName = `${currentPath}/${formview}/${id}`;

    if (pathname) {
        return `${pathname}/${formview}/${id}`;
    }

    return `${pathName}`;
};
