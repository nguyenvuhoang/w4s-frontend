import { RuleStrong } from "@shared/types/systemTypes";

export const getHiddenFields = (rules: RuleStrong[]): string[] => {
    const visibilityRule = rules.find(rule => rule.code === 'visibility');
    if (visibilityRule) {
        const { component_event, visible, component_result } = visibilityRule.config || {};
        const fields = component_result?.split(';').map((field: string) => field.trim()) || [];
        return fields.filter((field: string) => {
            if ((component_event === 'on_click' || component_event === 'on_change') && visible === 'true') {
                return false;
            }

            if (visible === 'false') {
                return true;
            }

            return false;
        });
    }
    return [];
};

