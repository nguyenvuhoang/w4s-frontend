'use client'

import { Alert, Button, Stack } from '@mui/material'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import PaginationPage from '@/@core/components/jTable/pagination'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'

import { useWaterMeterSearch } from '../hooks/useWaterMeterSearch'
import { waterText } from '../hooks/useWaterMeterReading'
import type { WaterMeterSearchPageProps } from '../types'
import WaterMeterFilterBar from './WaterMeterFilterBar'
import WaterMeterReadingTable from './WaterMeterReadingTable'

const WaterMeterReadingContent = (props: WaterMeterSearchPageProps) => {
    const { dictionary, session, locale } = props
    const meter = useWaterMeterSearch({
        dictionary,
        sessiontoken: session?.user?.token ?? undefined,
        language: locale,
        initial_filter: props.initial_filter,
        initial_data: props.initial_data
    })

    return (
        <ContentWrapper title={waterText(dictionary, 'water_meter_reading')} description={waterText(dictionary, 'water_meter_reading_description')} icon={<WaterDropOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary} issearch>
            <RequireWorkingProject dictionary={dictionary} sessiontoken={session?.user?.token ?? undefined} language={locale}>
                {meter.selected_project && (
                    <Stack spacing={3} sx={{ mt: 3 }}>
                        <WaterMeterFilterBar
                            dictionary={dictionary}
                            draft_filter={meter.draft_filter}
                            building_options={meter.building_options}
                            building_options_loading={meter.building_options_loading}
                            apartment_options={meter.apartment_options}
                            apartment_options_loading={meter.apartment_options_loading}
                            period_options={meter.period_options}
                            period_options_loading={meter.period_options_loading}
                            disabled={meter.loading}
                            on_filter_change={meter.updateDraftFilter}
                            on_building_change={meter.handleBuildingChange}
                            on_apartment_change={meter.handleApartmentChange}
                            on_period_change={meter.handlePeriodChange}
                            on_search={meter.handleSearch}
                            on_reset={meter.handleReset}
                        />

                        {meter.error && (
                            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void meter.loadData()}>{waterText(dictionary, 'search')}</Button>}>
                                {meter.error}
                            </Alert>
                        )}

                        <WaterMeterReadingTable
                            dictionary={dictionary}
                            locale={locale}
                            rows={meter.rows}
                            loading={meter.loading}
                            row_offset={(meter.filter.page_index - 1) * meter.filter.page_size}
                        />

                        {meter.total_count > 0 && (
                            <PaginationPage
                                page={meter.filter.page_index}
                                pageSize={meter.filter.page_size}
                                totalResults={meter.total_count}
                                jumpPage={meter.filter.page_index}
                                handlePageSizeChange={meter.handlePageSizeChange}
                                handlePageChange={meter.handlePageChange}
                                handleJumpPage={meter.handleJumpPage}
                                dictionary={dictionary}
                            />
                        )}
                    </Stack>
                )}
            </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default WaterMeterReadingContent
