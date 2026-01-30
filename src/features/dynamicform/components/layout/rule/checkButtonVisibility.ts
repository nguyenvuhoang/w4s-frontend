import { RuleStrong } from "@shared/types/systemTypes";

export const checkButtonVisibility = (
    rules: RuleStrong[],
    ismodify: boolean,
    code: string 
): boolean => {
    // Lá»c táº¥t cáº£ cÃ¡c rules phÃ¹ há»£p
    const visibilityRules = rules.filter(
        (rule) =>
            rule.code === "visibilitybutton" &&
            rule.inUse === true &&
            rule.config.component_action === "modify"
    );
    if (visibilityRules.length > 0) {
        // Kiá»ƒm tra táº¥t cáº£ cÃ¡c rules trong danh sÃ¡ch Ä‘Ã£ lá»c
        return visibilityRules.some((rule) => {
            const { component_result, ena_dis } = rule.config || {};
            return (
                ismodify &&
                component_result?.split(";").includes(code) && 
                ena_dis === "false"
            );
        });
    }

    return false;
};

