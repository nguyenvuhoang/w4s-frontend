import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Modal, Tab, Tabs, Select, MenuItem, Grid, Typography, FormHelperText } from '@mui/material';
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormTrigger } from 'react-hook-form';
import { FormValues } from '@shared/types';
import { getDictionary } from '@utils/getDictionary';

type Purpose = {
    id: number;
    name: string;
};

type Props = {
    control: Control<FormValues, any>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    errors: FieldErrors<FormValues>
    setValue: UseFormSetValue<FormValues>
    trigger: UseFormTrigger<FormValues>
    formData: FormValues | undefined;
};

const TransferPurposeModal = ({ control, dictionary, errors, setValue, trigger, formData }: Props) => {
    const [open, setOpen] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);

    const tabsRef = useRef<HTMLDivElement | null>(null); // Reference for the tabs container

    // List of purposes organized by categories (parentPurposes)
    const parentPurposes = [
        {
            id: 'essential',
            parent: 'Essential spendings',
            purposes: [
                { id: 1, name: 'Supermarket' },
                { id: 2, name: 'Dining' },
                { id: 3, name: 'Billing payment' },
                { id: 4, name: 'House rental' },
                { id: 5, name: 'Traffic spending' },
                { id: 6, name: 'Home helper' },
                { id: 7, name: 'Others' },
            ],
        },
        {
            id: 'shopping',
            parent: 'Shopping and entertainment',
            purposes: [
                { id: 8, name: 'Entertainment' },
                { id: 9, name: 'Shopping' },
                { id: 10, name: 'Spa, sports' },
                { id: 11, name: 'Household appliances' },
                { id: 12, name: 'Others' },
            ],
        },
        {
            id: 'education',
            parent: 'Education, medication, insurance',
            purposes: [
                {
                    id: 12,
                    name: 'Education'
                },
                {
                    id: 13,
                    name: 'Medication'
                },
                {
                    id: 14,
                    name: 'Insurance'
                },
                {
                    id: 15,
                    name: 'Others '
                }
            ],
        },
        {
            id: 'saving',
            parent: 'Saving',
            purposes: [
                {
                    id: 16,
                    name: 'Saving Open/Deposit'
                }
            ],
        },
        {
            id: 'investment',
            parent: 'Investment',
            purposes: [
                {
                    id: 17,
                    name: 'Securities'
                },
                {
                    id: 18,
                    name: 'Immovables'
                },
                {
                    id: 19,
                    name: 'Fund certificates'
                }
            ],
        },
        {
            id: 'other',
            parent: 'Other spendings',
            purposes: [
                {
                    id: 20,
                    name: 'Events'
                },
                {
                    id: 21,
                    name: 'Gift/Charities'
                },
                {
                    id: 22,
                    name: 'Public services'
                },
                {
                    id: 23,
                    name: 'Others'
                }
            ],
        },
    ];

    // Open the modal
    const handleOpen = () => setOpen(true);
    // Close the modal
    const handleClose = () => setOpen(false);

    // Handle changing the selected tab
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    // Handle selecting a purpose from the modal
    const handlePurposeSelect = (purpose: Purpose) => {
        setSelectedPurpose(purpose.name);
        setValue('transferpurpose', purpose.name); // Update form state with selected purpose
        trigger('transferpurpose'); // Trigger validation after selecting purpose
        handleClose(); // Close modal after selecting
    };

    // Handle mouse wheel scrolling for the Tabs component
    const handleWheelScroll = (event: React.WheelEvent) => {
        if (tabsRef.current) {
            const scrollAmount = event.deltaY;
            tabsRef.current.scrollLeft += scrollAmount;
        }
    };

    useEffect(() => {
        if (formData && formData.transferpurpose) {
            setSelectedPurpose(formData.transferpurpose); // Set the selected purpose from formData
        }
    }, [formData]);

    return (
        <>
            <Grid container spacing={5}>
                <Grid
                    style={{ display: 'flex', alignItems: 'center' }}
                    size={{
                        xs: 12,
                        sm: 4
                    }}>
                    <Typography>{dictionary['transfer'].transferpurpose}</Typography>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        sm: 8
                    }}>
                    <Controller
                        name="transferpurpose"
                        control={control}
                        rules={{
                            required: {
                                value: true,
                                message: `${dictionary['transfer'].transferpurpose} ${dictionary['common'].required}`,
                            }
                        }}
                        render={({ field }) => (
                            <>
                                <Select
                                    value={selectedPurpose || ''} // Use selected purpose or empty state
                                    onClick={handleOpen} // Open modal when clicking the select
                                    displayEmpty
                                    variant="outlined"
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Transfer Purpose' }}
                                    MenuProps={{
                                        disablePortal: true, // Prevent rendering dropdown
                                        PaperProps: {
                                            sx: { display: 'none' }, // Hide the dropdown entirely
                                        },
                                    }}
                                    renderValue={(selected) => {
                                        if (!selected) {
                                            return 'Select Transfer Purpose'; // Placeholder
                                        }
                                        return selected; // Display selected purpose
                                    }}
                                    error={Boolean(errors.transferpurpose)}
                                >
                                    <MenuItem value="" disabled>
                                        {dictionary['transfer'].selecttransferpurpose}
                                    </MenuItem>
                                    <MenuItem value={selectedPurpose || ''}>{selectedPurpose}</MenuItem>
                                </Select>
                                {errors.transferpurpose && (
                                    <FormHelperText error>
                                        {errors.transferpurpose.message}
                                    </FormHelperText>
                                )}
                            </>
                        )}
                    />
                </Grid>
            </Grid>
            <Modal open={open}
                onClose={handleClose}
                aria-labelledby="purpose-modal"
                aria-describedby="purpose-modal-description"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: '8px',
                        width: { xs: '55%', sm: '35%', md: '30%' },
                    }}
                >
                    {/* Modal header */}
                    <div className="header flex justify-between items-center my-5">
                        <div className="title a flex-1">
                            <h2 className="text-[#066a4c]">{dictionary['transfer'].choosepurpose}</h2>
                        </div>
                        <div className="ml-5">
                            <Button className="btn-only-icon btn size-medium level-ghost-mute" onClick={handleClose}>
                                <div className="prefix">
                                    <i className="ri-close-line"></i>
                                </div>
                                <div className="absolute w-1 h-full pointer-events-none"></div>
                            </Button>
                        </div>
                    </div>

                    {/* Tabs with gradient background, scrollable with mouse */}
                    <Tabs
                        value={tabIndex}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        TabIndicatorProps={{
                            style: { backgroundColor: 'transparent' },
                        }}
                        sx={{
                            '.MuiTabs-scrollButtons': {
                                color: '#66BB6A',
                                '&:hover': {
                                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                                },
                                transition: 'background-color 0.3s ease',
                            },
                        }}
                        ref={tabsRef}
                        onWheel={handleWheelScroll}
                    >
                        {parentPurposes.map((parent, index) => (
                            <Tab
                                key={index}
                                label={parent.parent}
                                sx={{
                                    background: 'linear-gradient(90deg, #66BB6A 0%, #388E3C 100%)',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                    marginX: '5px',
                                    opacity: tabIndex === index ? 1 : 0.7, 
                                }}
                            />
                        ))}
                    </Tabs>

                    {/* Purpose list for the selected tab */}
                    <Box mt={2}>
                        {parentPurposes[tabIndex].purposes.map((purpose) => (
                            <Button
                                key={purpose.id}
                                fullWidth
                                sx={{
                                    mb: 1,
                                    justifyContent: 'left',
                                    backgroundColor: '#f5f5f5',
                                    '&:hover': {
                                        backgroundColor: '#e0e0e0',
                                    },
                                }}
                                onClick={() => handlePurposeSelect(purpose)}
                            >
                                {purpose.name}
                            </Button>
                        ))}
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default TransferPurposeModal;


