'use client'

import Image from 'next/image';
import React from 'react';
import { Pagination } from 'swiper/modules';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';

const EventSwipper = () => {
    const images = [
        { src: '/images/pages/authenface.jpg', alt: 'authenface' },
        { src: '/images/pages/introduce.png', alt: 'introduce' },
        { src: '/images/pages/voucher.jpg', alt: 'voucher' },
    ];

    return (
        <Swiper
            navigation
            pagination={{ clickable: true }}
            modules={[Pagination]}
            spaceBetween={50}
            slidesPerView={1}
        >
            {images.map((image, index) => (
                <SwiperSlide key={index}>
                    <Image src={image.src} alt={image.alt} className="w-full h-auto" width={702} height={181} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export default EventSwipper;
