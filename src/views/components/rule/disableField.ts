import { RuleStrong } from "@/types/systemTypes";

export const disableField = (
    rules: RuleStrong[],
    columnKey: string,
    ismodify?: boolean
): boolean => {

    if (!rules || rules.length === 0) {
        return false;
    }

    if (!ismodify) {
        const visibilityRule = rules.find((rule) => rule.code === "visibility");

        if (visibilityRule) {
            const { component_event, ena_dis, component_result } = visibilityRule.config || {};
    
            const fields = component_result?.split(";").map((field: string) => field.trim()) || [];
    
            if (ismodify && fields.includes(columnKey)) {
                return true; 
            }
            
            if (ismodify && ena_dis === "false" && fields.includes(columnKey)) {
                return false; 
            }
    
            if (!ismodify && (component_event === "on_click" || component_event === "on_change")) {
                if (ena_dis === "false" && fields.includes(columnKey)) {
                    return false;
                }
            }
    
            if (ena_dis === "true" && fields.includes(columnKey)) {
                return true;
            }
        }
    
    } else {
        const visibilitymodifyRule = rules.find((rule) => rule.code === "visibilitymodify");
        if (visibilitymodifyRule) {
            const { component_result } = visibilitymodifyRule.config || {};
            const fields = component_result?.split(";").map((field: string) => field.trim()) || [];
            if (fields.includes(columnKey)) {
                return true; 
            }
        }    
    }
    return false;
};
