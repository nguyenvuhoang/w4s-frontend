import { RuleStrong } from "@/types/systemTypes";

export const checkButtonVisibility = (
    rules: RuleStrong[],
    ismodify: boolean,
    code: string 
): boolean => {
    // Lọc tất cả các rules phù hợp
    const visibilityRules = rules.filter(
        (rule) =>
            rule.code === "visibilitybutton" &&
            rule.inUse === true &&
            rule.config.component_action === "modify"
    );
    if (visibilityRules.length > 0) {
        // Kiểm tra tất cả các rules trong danh sách đã lọc
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
