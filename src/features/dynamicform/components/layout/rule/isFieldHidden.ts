import { RuleStrong } from "@shared/types/systemTypes";

export const isFieldHidden = (rules: RuleStrong[], columnKey: string): boolean => {

    const visibilityRules = rules.filter(rule => rule.code === 'visibility');
    // Kiá»ƒm tra tá»«ng rule trong visibilityRules
    for (const rule of visibilityRules) {
        const { component_result, component_event, visible } = rule.config || {};

        // PhÃ¢n tÃ¡ch component_result thÃ nh danh sÃ¡ch cÃ¡c field
        const resultFields = component_result?.split(';').map((field: string) => field.trim()) || [];
        
        // Kiá»ƒm tra náº¿u field náº±m trong component_result vÃ  cÃ¡c Ä‘iá»u kiá»‡n khÃ¡c
        if (
            resultFields.includes(columnKey) && // Field náº±m trong component_result

            component_event === 'on_change' && // Sá»± kiá»‡n lÃ  "on_change"

            visible === 'false' // Field Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u lÃ  áº©n
        ) {
            return true; // Field bá»‹ áº©n
        }
    }

    return false; // KhÃ´ng cÃ³ rule nÃ o áº©n field nÃ y
};

