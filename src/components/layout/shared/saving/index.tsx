'use client';

import ButtonGradient from '@/components/forms/button-gradient';
import { Locale } from '@/configs/i18n';
import { env } from '@/env.mjs';
import { SavingProductList } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import { getLocalizedUrl } from '@/utils/i18n';
import SwalAlert from '@/utils/SwalAlert';
import { Box, Card, CardContent, CardMedia, Grid, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    savingDataList: SavingProductList
    locale: Locale
}

const SavingProduct = ({ dictionary, savingDataList, locale }: Props) => {

    const router = useRouter()

    const handleClick = (lang: string, register: boolean, url: string) => {
        if (!register) {
            SwalAlert('error', dictionary['saving'].notallowregister)
        } else {
            router.push(getLocalizedUrl(url ?? "/", lang))
        }
    }


    return (
        <Grid container spacing={3}>
            {savingDataList.data?.map((saving, index) => (
                <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 3, md: 0 }} key={index}>
                    <Card sx={{ display: 'flex', height: '100%' }}>
                        <CardMedia
                            component="img"
                            sx={{ width: 160, maskImage: 'linear-gradient(to right, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)' }}
                            image={`${env.NEXT_PUBLIC_API_IMAGE}/sub/saving/${saving.productimage}.svg`}
                            alt={dictionary['saving'].onlinefixeddeposit}
                        />
                        <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" sx={{ fontFamily: 'Quicksand', color: '#218838' }} gutterBottom>
                                    {saving.productname}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'Quicksand' }} gutterBottom>
                                    {saving.description}
                                </Typography>
                            </Box>
                            <ButtonGradient onClick={() => handleClick(locale, saving.isallowregister, saving.producturl)} className="w-32" variant="contained">
                                {dictionary['common'].opennow}
                            </ButtonGradient>

                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}

export default SavingProduct;
