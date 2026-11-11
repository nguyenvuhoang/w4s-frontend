'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { apartmentText } from '../apartmentHelpers'
import { apartmentSearchService } from '../services/apartmentSearchService'
import type { ApartmentBuildingOption, ApartmentDictionary, ApartmentFloorOption } from '../types'

/**
 * Tower / floor options of the apartment create & edit forms, from the real search workflows:
 * project -> towers; tower -> floors. `initialBuildingId` (edit) also loads that tower's floors so the
 * current floor can be preselected.
 */
export function useApartmentLocationOptions({
  dictionary,
  sessiontoken,
  locale,
  projectId,
  initialBuildingId = null
}: {
  dictionary: ApartmentDictionary
  sessiontoken?: string
  locale: Locale
  projectId: number | null
  initialBuildingId?: number | null
}) {
  const [buildingOptions, setBuildingOptions] = useState<ApartmentBuildingOption[]>([])
  const [buildingsLoading, setBuildingsLoading] = useState(false)
  const [floorOptions, setFloorOptions] = useState<ApartmentFloorOption[]>([])
  const [floorsLoading, setFloorsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const fetchFloors = useCallback((buildingId: number) => apartmentSearchService.simpleSearchFloors({
    sessiontoken,
    language: locale,
    project_id: projectId ?? 0,
    building_id: buildingId
  }), [locale, projectId, sessiontoken])

  // Project changed (or first load): reset the options and load the project's towers.
  useEffect(() => {
    let current = true

    Promise.resolve().then(async () => {
      if (!current) return
      setBuildingOptions([])
      setFloorOptions([])
      setOptionsError(null)
      if (!projectId) return

      setBuildingsLoading(true)
      setFloorsLoading(Boolean(initialBuildingId))
      try {
        const [buildings, floors] = await Promise.all([
          apartmentSearchService.simpleSearchBuildings({ sessiontoken, language: locale, project_id: projectId }),
          initialBuildingId ? fetchFloors(initialBuildingId) : Promise.resolve([])
        ])

        if (current) {
          setBuildingOptions(buildings)
          setFloorOptions(floors)
        }
      } catch (error) {
        if (current) setOptionsError(error instanceof Error ? error.message : apartmentText(dictionary, 'loadBuildingsFailed', 'Unable to load towers.'))
      } finally {
        if (current) {
          setBuildingsLoading(false)
          setFloorsLoading(false)
        }
      }
    })

    return () => { current = false }
  }, [dictionary, fetchFloors, initialBuildingId, locale, projectId, sessiontoken])

  /** Tower changed: drop the old floors and load the new tower's floors. */
  const loadFloors = async (buildingId: number | null) => {
    setFloorOptions([])
    setOptionsError(null)
    if (!projectId || !buildingId) return

    setFloorsLoading(true)
    try {
      setFloorOptions(await fetchFloors(buildingId))
    } catch (error) {
      setOptionsError(error instanceof Error ? error.message : apartmentText(dictionary, 'loadFloorsFailed', 'Unable to load floors.'))
    } finally {
      setFloorsLoading(false)
    }
  }

  return { buildingOptions, buildingsLoading, floorOptions, floorsLoading, optionsError, loadFloors }
}
