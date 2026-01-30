import { v4 as uuidv4 } from 'uuid';

export const generateDynamicJson = (
    parametersConfig: Record<string, any>,
    localValue: any
) => {
    const dynamicJson: Record<string, any> = {};

    for (const [key, valueConfig] of Object.entries(parametersConfig)) {
        if (!valueConfig) {
            console.warn(`Value config for key "${key}" is null or undefined.`);
            continue;
        }

        if (typeof valueConfig === 'string') {
            // Nếu valueConfig là chuỗi, kiểm tra và thực thi như một hàm
            try {
                const executeFunction = new Function(
                    'localValue',
                    'uuidv4',
                    `return (${valueConfig})();`
                );
                dynamicJson[key] = executeFunction(localValue, uuidv4);
            } catch (error) {
                console.error(`Error executing string function for key "${key}":`, error);
                dynamicJson[key] = null; // Xử lý lỗi an toàn
            }
        } else if (typeof valueConfig === 'object' && valueConfig.key) {
            const formValue = localValue[valueConfig.key] || localValue || valueConfig.default || null;
            dynamicJson[key] = formValue;
        } else {
            dynamicJson[key] = valueConfig;
        }
    }

    return dynamicJson;
};
