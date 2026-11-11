export type TableInteractionConfig = {
    /**
     * Default way a Search Table row opens its Detail view when a screen doesn't set its own
     * `rowInteraction.mode`. Change this one value to retarget every migrated Search Table for
     * this deployment/customer — e.g. to 'single-click' — without touching any table's source.
     * A screen that genuinely needs different behavior (including no row-click-to-detail at all,
     * via `mode: 'none'`) still overrides it locally; this is only the system-wide fallback.
     */
    detailOpenMode: 'single-click' | 'double-click'
}

const tableConfig: TableInteractionConfig = {
    detailOpenMode: 'single-click'
}

export default tableConfig
