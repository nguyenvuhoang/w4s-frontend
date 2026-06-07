import { generatePathNameView } from "@utils/generatePathNameView";
import { getLocalizedUrl } from "@utils/i18n";
import { i18n } from "@configs/i18n";

export const handlePostViewData = async (
    txFo_: any,
    selectedRowsTableSearchRef: any,
): Promise<boolean> => {
    if (!selectedRowsTableSearchRef || selectedRowsTableSearchRef.length === 0) {
        return false;
    }

    try {
        const maybeLocale = window.location.pathname.split('/').filter(Boolean)[0] ?? null;
        const languageCode = i18n.locales.includes(maybeLocale as (typeof i18n.locales)[number]) ? maybeLocale : null;
        const currentPath = getLocalizedUrl('/form-view', languageCode);
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

