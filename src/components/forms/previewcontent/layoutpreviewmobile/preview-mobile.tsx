import { Locale } from "@/configs/i18n";
import { FormLayoutMobile } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import { Box, Grid, Typography } from "@mui/material";
import { v4 as uuidv4 } from 'uuid';
import { RenderPreviewMobileInput } from "./previewmobileinput";

export const RenderMobilePreView = (
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    view: FormLayoutMobile
) => {

    if (view.isTab) {
        return null; // Tabs are handled separately
    }

    // Non-tab views
    return (
        <>
            <Box key={`${view.viewName}-${uuidv4()}` || `view-${view.viewName}`}>
                {/* Title Section */}
                {view.viewLabel && (
                    <Typography
                        variant="h4"
                        sx={{
                            color: "#074C31",
                            fontWeight: "bold",
                            textAlign: "center",
                            marginBottom: 2,
                        }}
                    >
                        {view.viewLabel}
                    </Typography>
                )}

                <Grid container spacing={2} key={`${view.viewName}-${uuidv4()}` || `view-${view.viewName}`}>
                    {view.content?.map((content, index) =>
                        RenderPreviewMobileInput(
                            language,
                            dictionary,
                            content,
                            index
                        )
                    )}
                </Grid>
            </Box>
        </>
    );
};
