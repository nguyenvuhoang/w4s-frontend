import { Locale } from "@/configs/i18n";
import { FormView } from "@shared/types/systemTypes";
import { getDictionary } from "@utils/getDictionary";
import { Grid } from "@mui/material";
import { v4 as uuidv4 } from 'uuid';
import { RenderPreviewInput } from "./previewinput";

export const RenderPreView = (
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    view: FormView
) => {

    if (view.isTab === 'true') {
        return null; // Tabs are handled separately
    }

    // Non-tab views
    return (
        <Grid container spacing={2} key={`${view.id}-${uuidv4()}` || `view-${view.code || view.id}`}>
            {view.list_input?.map((input, index) =>
                RenderPreviewInput(
                    language,
                    dictionary,
                    input,
                    index)
            )}
        </Grid>
    );
};

