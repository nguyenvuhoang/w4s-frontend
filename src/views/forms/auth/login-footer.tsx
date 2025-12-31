'use client'

import LanguageDropdown from '@/@core/components/layouts/shared/LanguageDropdown'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import ContactInfoModal from '@/views/components/contact-modal'
import Link from 'next/link'

const LoginFooter = ({ dictionary, locale }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    locale: Locale
}) => {

    return (
        <div className="footer text-white/80 ng-star-inserted">
            <div className="grid lg:grid-cols-[auto,auto,auto] 2xl:grid-cols-[1fr,auto,1fr] items-center justify-center gap-4 max-w-[1240px] m-auto">
                <div className="col" />
                <div className="col">
                    <div className="box-black rounded-full ">
                        <div className="box-black-inner">
                            <Link href="/html/termservice" className="flex flex-col items-center justify-center space-y-2 text-center hover:text-primary-2" target="_blank">
                                <i className="ri-file-info-line text-[#A1C038] text-xl"></i>
                                <span>{dictionary['auth'].termandservice}</span>
                            </Link>

                            <Link href="#" className='flex flex-col items-center justify-center space-y-2 text-center hover:text-primary-2 ng-star-inserted'>
                                <i className='ri-health-book-line text-[#A1C038] text-xl'></i>
                                <span>{dictionary['auth'].userguide}</span>
                            </Link>
                            <Link href="/pdf/SAFE_TRANSACTION_MB" target='_blank' className='flex flex-col items-center justify-center space-y-2 text-center hover:text-primary-2 ng-star-inserted'>
                                <i className='ri-health-book-line text-[#A1C038] text-xl'></i>
                                <span>{dictionary['auth'].safetransactionguideline}</span>
                            </Link>
                            <Link href="#" className='flex flex-col items-center justify-center space-y-2 text-center hover:text-primary-2 ng-star-inserted'>
                                <i className='ri-question-answer-line text-[#A1C038] text-xl'></i>
                                <span>{dictionary['auth'].frequentlyaskedquestions}</span>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="h-full col">
                    <div className="h-full box-black box-black-right rounded-full">
                        <div className="flex !items-center h-full box-black-inner">
                            <div className="flex justify-between space-x-3 lg:justify-center">
                                <LanguageDropdown lang={locale} />
                                <ContactInfoModal dictionary={dictionary} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginFooter
