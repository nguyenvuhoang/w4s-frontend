import { RuleStrong } from "@shared/types/systemTypes";

export const disableButton = (rules: RuleStrong[], buttoncode: string): boolean => {
    // Láº¥y táº¥t cáº£ cÃ¡c rule cÃ³ code === "visibility"
    const visibilityRules = rules.filter(rule => rule.code === 'visibility');

    // Duyá»‡t qua táº¥t cáº£ cÃ¡c rule visibility
    for (const rule of visibilityRules) {
        const { component_event, ena_dis, component_result, component_action } = rule.config || {};
        const resultCodes = component_result?.split(';').map((code: string) => code.trim()) || [];
        if (resultCodes.includes(buttoncode) && (component_event === 'on_change' || (component_action !== component_result && component_event === 'on_click')) && ena_dis === 'true') {
            return true;
        }
    }

    return false;
};

