import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    OutlinedInput,
    Typography
} from '@mui/material';
import { Session } from 'next-auth';
import { useState } from 'react';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    formData: any;
    session: Session | null;
    language: Locale;
    rules: RuleStrong[];
    ismodify?: boolean;
};

const MultiSelectWithDialog = ({ gridProps, ismodify }: Props) => {
    const label = 'OpenAPI Tags (openapi_tags)'
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>(['ABC']);

    const [tempSelected, setTempSelected] = useState<string[]>(selectedTags);

    const toggleDialog = () => setOpen(!open);

    const handleSelect = (value: string) => {
        const isSelected = tempSelected.includes(value);
        if (isSelected) {
            setTempSelected(tempSelected.filter((v) => v !== value));
        } else {
            setTempSelected([...tempSelected, value]);
        }
    };

    const handleTagChange = (tags: string[]) => {
        setSelectedTags(tags);
    };

    const handleSave = () => {
        toggleDialog();
    };

    const handleAddNewLabel = () => {
        console.log('Add new label clicked');
    };


    const options = [
        { value: 'abc', label: 'ABC' },
        { value: 'account_information', label: 'AccountInformation' },
        { value: 'car', label: 'CAR' },
        { value: 'card_zone', label: 'CardZone' },
        { value: 'catalogue_definition', label: 'CatalogueDefinition' },
        { value: 'clearing_account', label: 'ClearingAccountDefinition' },
    ];


    const renderChips = () => {
        return (
            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedTags.map((tag, index) => (
                    <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)} // Add delete functionality if needed
                        sx={{
                            border: '1px solid #1976d2',
                            color: '#1976d2',
                            fontWeight: 'bold',
                            '& .MuiChip-deleteIcon': {
                                color: '#1976d2',
                            },
                        }}
                    />
                ))}
            </Box>
        );
    };

    const handleDeleteTag = (tagToDelete: string) => {
        setSelectedTags((prev) => prev.filter((tag) => tag !== tagToDelete));
    };


    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <FormControl fullWidth>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '2px',
                    }}
                    onClick={toggleDialog}
                >
                    {renderChips()}
                    <IconButton size="small">
                        <EditIcon />
                    </IconButton>
                </Box>
                <Dialog open={open} onClose={toggleDialog} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {label}
                        <IconButton size="small" onClick={toggleDialog}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <OutlinedInput
                            fullWidth
                            size="small"
                            placeholder="Search"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Typography>(jselect_search)</Typography>
                                </InputAdornment>
                            }
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            sx={{ marginBottom: '16px' }}
                        />
                        <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {options
                                .filter((option) =>
                                    option.label.toLowerCase().includes(filter.toLowerCase())
                                )
                                .map((option) => (
                                    <Box
                                        key={option.value}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            borderBottom: '1px solid #eee',
                                        }}
                                    >
                                        <Checkbox
                                            checked={tempSelected.includes(option.value)}
                                            onChange={() => handleSelect(option.value)}
                                        />
                                        <Typography>{option.label}</Typography>
                                    </Box>
                                ))}
                        </Box>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleAddNewLabel}
                            sx={{ marginTop: '16px' }}
                        >
                            Add new labels
                        </Button>

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={toggleDialog}>Cancel</Button>
                        <Button variant="contained" onClick={handleSave}>
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </FormControl>
        </Grid>
    );
};

export default MultiSelectWithDialog;
