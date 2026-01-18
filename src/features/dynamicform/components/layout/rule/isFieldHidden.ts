import { RuleStrong } from "@/types/systemTypes";

export const isFieldHidden = (rules: RuleStrong[], columnKey: string): boolean => {

    const visibilityRules = rules.filter(rule => rule.code === 'visibility');
    // Kiểm tra từng rule trong visibilityRules
    for (const rule of visibilityRules) {
        const { component_result, component_event, visible } = rule.config || {};

        // Phân tách component_result thành danh sách các field
        const resultFields = component_result?.split(';').map((field: string) => field.trim()) || [];
        
        // Kiểm tra nếu field nằm trong component_result và các điều kiện khác
        if (
            resultFields.includes(columnKey) && // Field nằm trong component_result

            component_event === 'on_change' && // Sự kiện là "on_change"

            visible === 'false' // Field được đánh dấu là ẩn
        ) {
            return true; // Field bị ẩn
        }
    }

    return false; // Không có rule nào ẩn field này
};
