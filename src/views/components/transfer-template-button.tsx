'use client'

import TransferTemplate from '@/@core/svg/TransferTemplate';
import { bankServiceApi } from '@/servers/bank-service';
import { FormValues } from '@/types';
import { TemplateTransfer } from '@/types/bankType';
import { formatAmount } from '@/utils/formatAmount';
import { formatCurrency } from '@/utils/formatCurrency';
import { getDictionary } from '@/utils/getDictionary';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Dispatch, SetStateAction, useState } from 'react';
import { UseFormSetValue, UseFormTrigger } from 'react-hook-form';

const TransferTemplateButton = ({
    transfertype, dictionary, setValue, trigger, setChooseReceiver, setFormattedAmount, setSelectedCurrency
}: {
    transfertype: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    setValue: UseFormSetValue<FormValues>
    trigger: UseFormTrigger<FormValues>
    setChooseReceiver: Dispatch<SetStateAction<boolean>>
    setFormattedAmount: Dispatch<SetStateAction<string>>
    setSelectedCurrency: Dispatch<SetStateAction<string>>
}) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transferTemplates, setTransferTemplates] = useState<TemplateTransfer[]>([]); // State to store transfer templates
    const { data: session } = useSession();

    const handleOpen = async (session: Session | null) => {
        setIsLoading(true);


        const requestTransferTemplate = await bankServiceApi.getTransferTemplate(
            { sessiontoken: session?.user?.token as string }
        );


        if (requestTransferTemplate.status !== 200) {
            console.error('Error fetching transfer template');
            setIsLoading(false);
            return;
        }

        const templates = requestTransferTemplate.payload.dataresponse?.fo[0].input.listtemplate;

        setTransferTemplates(templates || []);

        setIsLoading(false);
        setOpen(true); // Open modal after data is loaded
    };

    const handleClose = () => setOpen(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [focused, setFocused] = useState(false);

    const handleSearchChange = (e: { target: { value: SetStateAction<string>; }; }) => {
        setSearchTerm(e.target.value);
    };

    const handleClear = () => {
        setSearchTerm('');
    };

    const handleTemplateClick = (template: TemplateTransfer) => {
        setChooseReceiver(true);
        setValue('accountcardreceived', template.receiveraccount);
        setValue('receivername', template.receivername);
        setValue('benificiarybank', {
            bankcode: template.bankcode,
            bankname: template.bankinfor[0].name,
            banklogo: template.bankinfor[0].logo,
            bankshortname: template.bankinfor[0].shortname
        });
        setValue('amountinfo.amount', template.amount);
        setValue('amountinfo.currency', template.currencycode);
        setFormattedAmount(formatAmount(template.amount));
        setSelectedCurrency(template.currencycode);
        setValue('content', template.description);
        trigger(['accountcardreceived', 'receivername', 'benificiarybank', 'amountinfo.amount', 'amountinfo.currency', 'content']);

        // Close the modal
        setOpen(false);
    };


    return (
        <>
            {/* Button to open modal */}
            <button
                type="button"
                role="button"
                className="btn size-small level-text-link bg-transparent"
                onClick={() => handleOpen(session)}
                style={{ cursor: 'pointer' }}
                disabled={isLoading}
            >
                <div className="prefix">
                    <div className="icon-svg fill- w-6 h-6">
                        <TransferTemplate />
                    </div>
                </div>
                <div className="title">{dictionary['transfer'].transfertemplate}</div>
                <div className="absolute w-1 h-full pointer-events-none"></div>
            </button>

            {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <CircularProgress />
                </div>
            )}

            {/* Modal displaying list of templates */}
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="beneficiaries-modal-title"
                aria-describedby="beneficiaries-modal-description"
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
                        width: { xs: '50%', sm: '40%', md: '30%' },
                    }}
                    className="main space-y-6 md:space-y-6 modal-wrap"
                >
                    <div className="header flex justify-between items-center">
                        <div className="title a flex-1">
                            <h2 className="text-[#066a4c]">{dictionary['transfer'].transfertemplate_select}</h2>
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

                    <div className="my-5">
                        <TextField
                            label="Search Template"
                            variant="outlined"
                            fullWidth
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            sx={{
                                boxShadow: focused ? '0 0 5px 2px rgba(0, 0, 0, 0.2)' : 'none',
                                transition: 'box-shadow 0.3s ease',
                                borderRadius: '8px',
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleClear} edge="end">
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>

                    {/* Dynamically generate the template data */}
                    {transferTemplates.map((template, index) => {
                        return (
                            <Box
                                key={index}
                                sx={{
                                    padding: 2,
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0',
                                    transition: 'box-shadow 0.3s ease',
                                    '&:hover': {
                                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                                    },
                                    marginBottom: '15px'
                                }}
                                onClick={() => handleTemplateClick(template)}
                            >
                                {/* Title template */}
                                <h2 className="text-lg font-semibold">{template.templatename}</h2>

                                {/* Account number and amount */}
                                <div className="flex justify-between items-center py-2">
                                    <div className="account-number text-gray-600">{template.receiveraccount}</div>
                                    <div className="amount text-green-600 font-bold">{formatCurrency(template.amount, template.currencycode)}</div>
                                </div>

                                {/* Bank logo and bank name */}
                                <div className="flex items-center py-2">
                                    <Image
                                        src={template.bankinfor[0].logo}
                                        alt={`${template.bankcode} Logo`}
                                        width={84}
                                        height={32}
                                        className="mr-2"
                                    />
                                    <div className="bank-name text-gray-600">{template.bankinfor[0].name}</div>
                                </div>

                                {/* Transaction description */}
                                <div className="transaction-description text-gray-500 mt-3">
                                    {template.description}
                                </div>
                            </Box>
                        )
                    }
                    )}

                </Box>
            </Modal>
        </>
    );
};

export default TransferTemplateButton;
