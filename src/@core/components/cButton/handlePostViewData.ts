import { generatePathNameView } from "@/utils/generatePathNameView";

export const handlePostViewData = async (
    txFo_: any,
    selectedRowsTableSearchRef: any,
): Promise<boolean> => {
    if (!selectedRowsTableSearchRef || selectedRowsTableSearchRef.length === 0) {
        return false;
    }

    try {
        const currentPath = `/form-view`;
        const _txFo = txFo_;
        const pathname = _txFo[0].pathname ?? "";
        const parameters = _txFo[0].parameters;

        const viewid = selectedRowsTableSearchRef[0][parameters];
        const newPath = generatePathNameView(viewid, currentPath, _txFo, pathname);
        window.open(newPath, "_blank");

        return true;
    } catch (error) {
        console.error("handlePostViewData error:", error);
        return false;
    }
};
