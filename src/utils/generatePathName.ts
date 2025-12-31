export const generatePathName = (id: any, currentPath: string, data: any) => {
    const jsonData = JSON.parse(data)
    const storeName = jsonData[0].input?.storename;
    const storeType = jsonData[0].txcode;
    const pathName = `${currentPath}/${storeType}/${storeName}/${id}`;

    return `${pathName}`;
};
