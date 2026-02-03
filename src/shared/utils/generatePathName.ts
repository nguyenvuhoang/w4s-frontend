export const generatePathName = (id: any, currentPath: string, data: any) => {
    if (!data || typeof data !== 'string') return currentPath;
    try {
        const jsonData = JSON.parse(data)
        const storeName = jsonData[0]?.input?.storename;
        const storeType = jsonData[0]?.txcode;
        if (!storeName || !storeType) return currentPath;
        const pathName = `${currentPath}/${storeType}/${storeName}/${id}`;

        return `${pathName}`;
    } catch (error) {
        console.error('Error parsing JSON in generatePathName:', error);
        return currentPath;
    }
};
