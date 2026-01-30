import { Locale } from "@/configs/i18n";
import { FormView } from "@shared/types/systemTypes";
import { getDictionary } from "@utils/getDictionary";
import { Box, Grid, Tab, Tabs } from "@mui/material";
import { RenderPreviewInput } from "./previewinput";

export const RenderPreviewTabs = (
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    tabViews: FormView[],
    activeTab: number,
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void,
) => {

    return (
        <Box
            sx={{
                width: '100%',
                marginTop: 10,
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#fff',
            }}
        >
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Dynamic Tabs"
                sx={{
                    marginBottom: '16px', // Space between the tabs and the content
                }}
            >
                {tabViews.map((tabView, index) => (
                    <Tab
                        label={tabView.name || `Tab ${index + 1}`}
                        key={tabView.code || `tab-${index}`}
                        sx={{
                            textTransform: 'none', // Avoid all caps text
                            fontWeight: '500',
                            minWidth: '120px',
                        }}
                    />
                ))}
            </Tabs>
            {tabViews.map((tabView, index) => (
                <Box
                    key={tabView.code || `tabpanel-${index}`}
                    role="tabpanel"
                    hidden={activeTab !== index}
                    id={`tabpanel-${index}`}
                    aria-labelledby={`tab-${index}`}
                    sx={{
                        marginTop: 2,
                        border: tabView.isBorder === 'true' ? '1px solid #ddd' : 'none',
                        borderRadius: '8px',
                        padding: tabView.isBorder === 'true' ? '16px' : '0',
                    }}
                >
                    {activeTab === index && (
                        <Grid container spacing={2}>
                            {tabView.list_input.map((input, index) =>
                                RenderPreviewInput(
                                    language,
                                    dictionary,
                                    input,
                                    index
                                ))}
                        </Grid>
                    )}
                </Box>
            ))}
        </Box>
    );
};

