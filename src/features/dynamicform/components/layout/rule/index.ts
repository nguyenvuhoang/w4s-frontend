import { RuleStrong } from "@shared/types/systemTypes";
import { Dispatch, SetStateAction } from "react";

export const checkRules = (
    rules: RuleStrong[],
    setDisableButtonClick: Dispatch<SetStateAction<boolean>>,
    ismodify: boolean,
    fieldname: string
) => {
    // Lá»c táº¥t cáº£ cÃ¡c rules thá»a mÃ£n Ä‘iá»u kiá»‡n
    const visibilityRules = rules.filter(
        (rule) =>
            rule.code === "visibility" &&
            rule.inUse === true &&
            rule.config.component_event === "on_click"
    );


    // Náº¿u khÃ´ng cÃ³ rules phÃ¹ há»£p, cho phÃ©p nÃºt hoáº¡t Ä‘á»™ng
    if (visibilityRules.length === 0) {
        setDisableButtonClick(false);
        return;
    }

    // Æ¯u tiÃªn kiá»ƒm tra Ä‘iá»u kiá»‡n khi `ismodify` lÃ  true
    if (ismodify) {
        const shouldEnable = visibilityRules.some((rule) => {
            const { component_result, ena_dis } = rule.config || {};
            const fields = component_result?.split(";") || [];
            return ena_dis === "false" && fields.includes(fieldname); // Kiá»ƒm tra Ä‘iá»u kiá»‡n
        });

        if (shouldEnable) {
            setDisableButtonClick(false); // Báº­t nÃºt
            return;
        }
    }

    // Kiá»ƒm tra cÃ¡c Ä‘iá»u kiá»‡n khÃ¡c náº¿u khÃ´ng pháº£i `ismodify`
    const shouldDisable = visibilityRules.some((rule) => {
        const { component_action, component_result, ena_dis } = rule.config || {};
        return component_action === component_result && ena_dis === "true";
    });

    // Cáº­p nháº­t tráº¡ng thÃ¡i disable button dá»±a trÃªn Ä‘iá»u kiá»‡n
    setDisableButtonClick(shouldDisable);
};

