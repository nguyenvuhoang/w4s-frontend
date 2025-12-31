export const createRequestHeaderJSON = (input: any) => {
    // Lấy tên từ default
    const name = input.default?.name || 'Request Header';

    // Chuyển data_default từ string sang object
    let dataDefaultObject = {};
    try {
        dataDefaultObject = JSON.parse(input.config?.data_default || '{}');
    } catch (error) {
        console.error('Invalid JSON format in data_default', error);
    }

    // Tạo object Request Header
    const requestHeader = {
        [name]: dataDefaultObject,
    };

    return requestHeader;
};
