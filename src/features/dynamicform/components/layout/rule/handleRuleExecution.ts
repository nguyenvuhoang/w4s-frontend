import { RuleStrong } from "@shared/types/systemTypes";
import { Dispatch, SetStateAction } from "react";


export const handleRuleExecution = async (
    rules: RuleStrong[],
    action: string, // NÃºt Ä‘ang nháº¥n
    setIsModify: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    // Lá»c cÃ¡c rules cÃ³ `code` lÃ  "calculator" vÃ  `component_action` khá»›p vá»›i action
    const matchingRules = rules.filter(
        (rule) =>
            rule.code === "calculator" &&
            rule.config.component_action === action
    );

    if (matchingRules.length > 0) {
        // Duyá»‡t qua tá»«ng rule Ä‘á»ƒ xá»­ lÃ½
        matchingRules.forEach((rule) => {
            const { component_event, function_cal, component_result } = rule.config;
            if (component_event === "on_click") {
                if (function_cal) {
                    const result = eval(function_cal);
                    let isModify = false;
                    if (typeof result === "boolean") {
                        isModify = result;
                    } else if (typeof result === "string") {
                        isModify = result.toLowerCase() === "true";
                    } else if (typeof result === "number") {
                        isModify = result !== 0;
                    } else {
                        console.warn("Unexpected type from function_cal:", typeof result);
                    }
                    setIsModify(isModify);
                }

            } else {
                console.log(`Unhandled event: ${component_event}`);
            }
        });
    } else {
        console.log(`No matching rule found for action: ${action}`);
    }
};

