import TabPanel from '@components/tab/tab-panel';
import { TabContent } from '@shared/types/systemTypes';
import { a11yProps } from '@utils/a11yProps';
import DataTable from '@/views/components/datatable';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Tab, Tabs, Tooltip, Typography } from '@mui/material';

type Props = {
    value: number
    handleChange: (event: React.SyntheticEvent, newValue: number) => void
    handleCloseTab: (index: number) => void
    handleCloseAllTabs: () => void
    data: TabContent[]
}

const JLayout = ({
    value,
    data,
    handleChange,
    handleCloseTab,
    handleCloseAllTabs
}: Props) => {

    return (
        <Box sx={{ width: '100%' }}>
            <Box
                sx={{
                    backgroundColor: '#089356',
                    color: 'white',
                    borderRadius: '10px 10px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingRight: 2,
                }}
            >
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="API management tabs"
                    TabIndicatorProps={{
                        style: {
                            display: 'none', // Hide default indicator
                        },
                    }}
                    sx={{ minHeight: '48px', flexGrow: 1 }}
                >
                    {data.map((tab, index) => (
                        <Tab
                            key={index}
                            label={
                                <Box display="flex" alignItems="center">
                                    {tab.label}
                                    <Box
                                        component="span"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseTab(index);
                                        }}
                                        sx={{
                                            ml: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            color: 'inherit',
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </Box>
                                </Box>
                            }
                            {...a11yProps(index)}
                            sx={{
                                color: value === index ? '#0a6f47' : 'white',
                                backgroundColor: value === index ? 'white' : 'transparent',
                                borderRadius: value === index ? '8px 10px 0 0' : '0',
                                fontWeight: value === index ? 'bold' : 'normal',
                                minHeight: '48px',
                                '&:hover': {
                                    backgroundColor: value === index ? 'white' : 'rgba(255, 255, 255, 0.2)',
                                },
                            }}
                        />
                    ))}
                </Tabs>
                {/* Close All Tabs Button */}
                <Tooltip title="Close All Tabs">
                    <Button
                        onClick={handleCloseAllTabs}
                        sx={{
                            color: 'white',
                            borderColor: 'white',
                            textTransform: 'none',
                            '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                        }}
                        variant="contained"
                    >
                        <CloseIcon fontSize="small" />
                    </Button>
                </Tooltip>
            </Box>
            {data.map((tab, index) => (
                <TabPanel key={index} value={value} index={index}>
                    <Box p={3}>
                        {data[value] && (
                            <>
                                <Typography variant="h4" color='#0A6F47' className='my-5'>{tab.label}</Typography>
                                <DataTable tabledata={data[value].content.tabledata} />
                            </>
                        )}
                    </Box>

                </TabPanel>
            ))}
        </Box>
    )
}

export default JLayout

