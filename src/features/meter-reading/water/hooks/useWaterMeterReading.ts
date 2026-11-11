import { useMemo, useState } from 'react'

import { WaterMeterWorkflowError, waterMeterReadingService } from '../services/waterMeterReadingService'
import type {
    SaveWaterMeterReadingRequest,
    WaterMeterDictionary,
    WaterMeterFilter,
    WaterMeterPeriod,
    WaterMeterReading,
    WaterUsageResponse
} from '../types'

type Params = {
    dictionary: WaterMeterDictionary
    sessiontoken?: string
    language?: any
    initial_filter: WaterMeterFilter
    initial_periods: WaterMeterPeriod[]
    initial_readings: WaterMeterReading[]
    initial_usage: WaterUsageResponse
}

type Notice = { severity: 'success' | 'error'; message: string }

export const waterText = (dictionary: WaterMeterDictionary, key: string) => (
    (dictionary as any)?.water_meter_reading?.[key] ?? key
)

const validId = (value: unknown) => Number.isInteger(Number(value)) && Number(value) > 0

export function useWaterMeterReading({
    dictionary,
    sessiontoken,
    language,
    initial_filter,
    initial_periods,
    initial_readings,
    initial_usage
}: Params) {
    const [filter, setFilter] = useState(initial_filter)
    const [draft_filter, setDraftFilter] = useState(initial_filter)
    const [periods, setPeriods] = useState(initial_periods)
    const [periods_project_id, setPeriodsProjectId] = useState<number | null>(initial_filter.project_id)
    const [readings, setReadings] = useState(initial_readings)
    const [usage, setUsage] = useState(initial_usage)
    const [periods_loading, setPeriodsLoading] = useState(false)
    const [data_loading, setDataLoading] = useState(false)
    const [mutation_loading, setMutationLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<Notice | null>(null)
    const [save_open, setSaveOpen] = useState(false)
    const [lock_open, setLockOpen] = useState(false)
    const [save_values, setSaveValues] = useState({ new_index: '', last_index: '' })
    const [save_error, setSaveError] = useState<string | null>(null)

    const selected_period = useMemo(
        () => periods.find(period => period.id === filter.water_meter_period_id) ?? null,
        [filter.water_meter_period_id, periods]
    )
    const period_locked = selected_period?.status.toUpperCase() === 'LOCKED'

    const loadPeriods = async (project_id: number, selected_period_id?: number | null, force = false) => {
        if (!validId(project_id)) return []
        if (!force && periods_project_id === project_id) return periods

        setPeriodsLoading(true)

        try {
            const next_periods = await waterMeterReadingService.listPeriods({ sessiontoken, language, project_id })

            setPeriods(next_periods)
            setPeriodsProjectId(project_id)

            if (selected_period_id && !next_periods.some(period => period.id === selected_period_id)) {
                setFilter(current => ({ ...current, water_meter_period_id: null }))
                setDraftFilter(current => ({ ...current, water_meter_period_id: null }))
            }

            return next_periods
        } finally {
            setPeriodsLoading(false)
        }
    }

    const loadReadingData = async (apartment_id: number, water_meter_period_id: number) => {
        if (!validId(apartment_id) || !validId(water_meter_period_id)) return

        setDataLoading(true)

        try {
            const [next_readings, next_usage] = await Promise.all([
                waterMeterReadingService.listReadings({ sessiontoken, language, apartment_id, water_meter_period_id }),
                waterMeterReadingService.getUsage({ sessiontoken, language, apartment_id, water_meter_period_id })
            ])

            setReadings(next_readings)
            setUsage(next_usage)
        } finally {
            setDataLoading(false)
        }
    }

    const handleSearch = async () => {
        setError(null)
        const project_id = Number(draft_filter.project_id)
        const apartment_id = Number(draft_filter.apartment_id)
        const period_id = Number(draft_filter.water_meter_period_id)

        if (!validId(project_id)) {
            setError(waterText(dictionary, 'project_required'))

            return
        }

        try {
            await loadPeriods(project_id, validId(period_id) ? period_id : null)

            const next_filter: WaterMeterFilter = {
                project_id,
                apartment_id: validId(apartment_id) ? apartment_id : null,
                water_meter_period_id: validId(period_id) ? period_id : null
            }

            setFilter(next_filter)
            setDraftFilter(next_filter)

            if (next_filter.apartment_id && next_filter.water_meter_period_id) {
                await loadReadingData(next_filter.apartment_id, next_filter.water_meter_period_id)
            } else {
                setReadings([])
                setUsage({ apartment_id: next_filter.apartment_id ?? 0, apartment_code: '', usage: [] })
            }
        } catch {
            setError(waterText(dictionary, 'load_failed'))
        }
    }

    const handleRefresh = async () => {
        if (!filter.project_id) return

        setError(null)

        try {
            await loadPeriods(filter.project_id, filter.water_meter_period_id, true)

            if (filter.apartment_id && filter.water_meter_period_id) {
                await loadReadingData(filter.apartment_id, filter.water_meter_period_id)
            }
        } catch {
            setError(waterText(dictionary, 'load_failed'))
        }
    }

    const updateDraftFilter = (key: keyof WaterMeterFilter, value: number | null) => {
        if (
            (key === 'project_id' || key === 'apartment_id') &&
            value !== null &&
            value < 0
        ) {
            return
        }
        setDraftFilter(current => ({
            ...current,
            [key]: value,
            ...(key === 'project_id' ? { water_meter_period_id: null } : {})
        }))
    }

    const handleOpenSave = (reading?: WaterMeterReading) => {
        if (period_locked) {
            setNotice({ severity: 'error', message: waterText(dictionary, 'locked_period_cannot_save') })

            return
        }

        setSaveValues({
            new_index: reading?.new_index === null || reading?.new_index === undefined ? '' : String(reading.new_index),
            last_index: reading?.last_index === null || reading?.last_index === undefined ? '' : String(reading.last_index)
        })
        setSaveError(null)
        setSaveOpen(true)
    }

    const handleSave = async () => {
        const apartment_id = filter.apartment_id
        const water_meter_period_id = filter.water_meter_period_id
        const new_index = Number(save_values.new_index)

        if (!apartment_id || !water_meter_period_id || save_values.new_index === '' || !Number.isFinite(new_index)) {
            setSaveError(waterText(dictionary, 'save_validation_error'))

            return
        }

        if (period_locked) {
            setSaveError(waterText(dictionary, 'locked_period_cannot_save'))

            return
        }

        const last_index: number | '' = save_values.last_index === '' ? '' : Number(save_values.last_index)

        if (last_index !== '' && !Number.isFinite(last_index)) {
            setSaveError(waterText(dictionary, 'save_validation_error'))

            return
        }

        const fields: SaveWaterMeterReadingRequest = { new_index, apartment_id, water_meter_period_id, last_index }

        setMutationLoading(true)
        setSaveError(null)

        try {
            await waterMeterReadingService.saveReading({ sessiontoken, language, fields })
            setSaveOpen(false)
            await loadReadingData(apartment_id, water_meter_period_id)
            setNotice({ severity: 'success', message: waterText(dictionary, 'save_reading_success') })
        } catch (err) {
            const locked = err instanceof WaterMeterWorkflowError && err.code === 'ips.watermeter.period.locked'

            setSaveError(waterText(dictionary, locked ? 'period_locked_error' : 'save_reading_failed'))
        } finally {
            setMutationLoading(false)
        }
    }

    const handleLock = async () => {
        if (!selected_period || period_locked) return

        setMutationLoading(true)

        try {
            await waterMeterReadingService.lockPeriod({ sessiontoken, language, water_meter_period_id: selected_period.id })
            setLockOpen(false)
            await handleRefresh()
            setNotice({ severity: 'success', message: waterText(dictionary, 'period_locked_success') })
        } catch {
            setNotice({ severity: 'error', message: waterText(dictionary, 'lock_period_failed') })
        } finally {
            setMutationLoading(false)
        }
    }

    return {
        filter,
        draft_filter,
        periods,
        readings,
        usage,
        selected_period,
        period_locked,
        periods_loading,
        data_loading,
        mutation_loading,
        error,
        notice,
        save_open,
        lock_open,
        save_values,
        save_error,
        updateDraftFilter,
        handleSearch,
        handleRefresh,
        handleOpenSave,
        handleSave,
        handleLock,
        setSaveOpen,
        setLockOpen,
        setSaveValues,
        setNotice
    }
}