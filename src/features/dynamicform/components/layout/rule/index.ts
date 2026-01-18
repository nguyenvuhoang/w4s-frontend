import { RuleStrong } from "@/types/systemTypes";
import { Dispatch, SetStateAction } from "react";

export const checkRules = (
    rules: RuleStrong[],
    setDisableButtonClick: Dispatch<SetStateAction<boolean>>,
    ismodify: boolean,
    fieldname: string
) => {
    // Lọc tất cả các rules thỏa mãn điều kiện
    const visibilityRules = rules.filter(
        (rule) =>
            rule.code === "visibility" &&
            rule.inUse === true &&
            rule.config.component_event === "on_click"
    );


    // Nếu không có rules phù hợp, cho phép nút hoạt động
    if (visibilityRules.length === 0) {
        setDisableButtonClick(false);
        return;
    }

    // Ưu tiên kiểm tra điều kiện khi `ismodify` là true
    if (ismodify) {
        const shouldEnable = visibilityRules.some((rule) => {
            const { component_result, ena_dis } = rule.config || {};
            const fields = component_result?.split(";") || [];
            return ena_dis === "false" && fields.includes(fieldname); // Kiểm tra điều kiện
        });

        if (shouldEnable) {
            setDisableButtonClick(false); // Bật nút
            return;
        }
    }

    // Kiểm tra các điều kiện khác nếu không phải `ismodify`
    const shouldDisable = visibilityRules.some((rule) => {
        const { component_action, component_result, ena_dis } = rule.config || {};
        return component_action === component_result && ena_dis === "true";
    });

    // Cập nhật trạng thái disable button dựa trên điều kiện
    setDisableButtonClick(shouldDisable);
};
