import { RuleStrong } from "@/types/systemTypes";

export const disableButton = (rules: RuleStrong[], buttoncode: string): boolean => {
    // Lấy tất cả các rule có code === "visibility"
    const visibilityRules = rules.filter(rule => rule.code === 'visibility');

    // Duyệt qua tất cả các rule visibility
    for (const rule of visibilityRules) {
        const { component_event, ena_dis, component_result, component_action } = rule.config || {};
        const resultCodes = component_result?.split(';').map((code: string) => code.trim()) || [];
        if (resultCodes.includes(buttoncode) && (component_event === 'on_change' || (component_action !== component_result && component_event === 'on_click')) && ena_dis === 'true') {
            return true;
        }
    }

    return false;
};
