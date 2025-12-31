import ButtonGradient from '@/components/forms/button-gradient';
import { formatAmount } from '@/utils/formatAmount';
import { getDictionary } from '@/utils/getDictionary';
import { Box, Button, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import CardShowMoreInfo from './more-info';
import { CardByID, CardList } from '@/types/bankType';
import { Locale } from '@/configs/i18n';
type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    carduser: CardByID
    locale: Locale
};

const CardUserInfo = ({dictionary, carduser, locale}: Props) => {
    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        alert('Copied to clipboard');
    };

    //State
    const [showinfo, setShowinfo] = useState(false);

    const card_limit = 25000000
    const temporary_outstanding_balance = 4010281
    const remaininglimit = card_limit - temporary_outstanding_balance

    const usage_percentage = (remaininglimit / card_limit) * 100


    const handleShowInfo = () => {
        setShowinfo(!showinfo);
    }

    const handleCloseInfo = () => {
        setShowinfo(false);
    };

    return (
        <div className="rounded-lg shadow-lg">
            {/* Cardholder Information Box */}
            <Box className="mb-4">
                <div className="bg-white p-4 rounded-t-lg">
                </div>
                {/* Content */}
                <div className="bg-gray-100 p-6 rounded-b-lg">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">{dictionary['card'].cardholdername}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">{carduser.cardholdername}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">{dictionary['card'].linkaccount}</p>
                        </div>
                        <div className="flex justify-end items-center">
                            <p className="font-semibold mr-2">{carduser.linkagedaccount}</p>
                            <Tooltip title="Copy">
                                <i
                                    className="ri-book-line w-4 h-4 cursor-pointer"
                                    onClick={() => handleCopy('V0180007817')}
                                />
                            </Tooltip>
                        </div>

                        <div></div>
                        <div className="flex justify-end items-center">
                            <Button
                                onClick={() => handleShowInfo()}
                                variant="outlined"
                                endIcon={
                                    <i className={showinfo ? 'ri-eye-off-line w-5 h-5' : 'ri-eye-line w-5 h-5 text-[#3C8A6A]'}></i>
                                }
                            >
                                {dictionary['common'].showinfo}
                            </Button>
                        </div>
                    </div>
                </div>
            </Box>

            {/* Remaining Credit Limit Box */}
            <Box className="mb-4">
                <div className="bg-white p-4 rounded-t-lg">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                            <h4 className="text-gray-600 font-semibold">{dictionary['card'].remaininglimit}</h4>
                            <Tooltip title={dictionary['card'].tooltipremaininglimit}>
                                <i className="ml-2 ri-information-line w-4 h-4 cursor-pointer text-[#3e8b68]" />
                            </Tooltip>
                        </div>
                        <p className="font-semibold ml-auto">{formatAmount(carduser.availablelimit)} VND</p>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-gray-100 p-6 rounded-b-lg">


                    <div className="flex justify-between items-center text-sm mb-2">
                        <div>
                            <p className="text-gray-500">{dictionary['card'].temporaryoutstandingbalance}</p>
                            <p className="font-semibold">{formatAmount(carduser.balance)} VND</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500">{dictionary['card'].remaininglimit}</p>
                            <p className="font-semibold">{formatAmount(carduser.availablelimit)} VND</p>
                        </div>
                    </div>

                    {/* Progress Bar for Credit Usage */}
                    <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                        <div
                            className="bg-gradient-to-r from-[#82B140] via-[#609D50] to-[#3C8A6A] h-full rounded-full"
                            style={{ width: `${usage_percentage}%` }} // Adjust based on actual usage
                        />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-gray-500">{dictionary['card'].cardlimit}</p>
                        <p className="font-semibold">{formatAmount(carduser.cardlimit)} VND</p>
                    </div>
                </div>
                <div className='flex justify-center my-10'>
                    <ButtonGradient className='w-48 text-center mb-5 flex justify-center'>
                        {dictionary['card'].paymentstatement}
                    </ButtonGradient>
                </div>
            </Box>

            <CardShowMoreInfo
                dictionary={dictionary}
                openModal={showinfo}
                handleCloseModal={handleCloseInfo}
            />

        </div>
    );
};

export default CardUserInfo;
