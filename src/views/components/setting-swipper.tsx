'use client';

import React from 'react';
import { env } from '@/env.mjs';
import Image from 'next/image';
import { Grid, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FavoriteFeature } from '@shared/types/bankType';
import { Box, Typography } from '@mui/material';
import { getDictionary } from '@utils/getDictionary';

const SettingSwipper = ({
    dictionary,
    functionschoosen
}: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    functionschoosen: FavoriteFeature[]
}) => {

    return (
        <>
            {functionschoosen && functionschoosen.length > 0 ? (
                <Swiper
                    modules={[Grid, Autoplay]}
                    grid={{
                        rows: 2,
                        fill: 'row',
                    }}
                    spaceBetween={10}
                    slidesPerView={3}
                    autoplay={{ delay: 3000 }}
                >
                    {functionschoosen.map((item, index) => (
                        <SwiperSlide key={index} className="flex flex-col items-center justify-center">
                            <Image src={`${env.NEXT_PUBLIC_API_IMAGE}sub/${item.icon}.svg`} alt={item.label} className="w-8 h-8 mb-2" width={32} height={32} />
                            <div className='text-[#0549247f] font-semibold'>{item.label}</div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            ) : (
                <Box className="flex flex-col items-center justify-center">
                    <Box sx={{ textAlign: 'center'}}>
                        <Image src="/images/illustrations/empty-list.svg" width={160} height={160} alt="No Transactions" style={{ marginBottom: '20px' }} />
                        <Typography variant="body1" color="textSecondary">
                            {dictionary['utility'].havenofavoritefunction}
                        </Typography>
                    </Box>
                </Box>
            )}
        </>
    );
}

export default SettingSwipper;

