// hooks/useRowSelection.ts
import { useState } from 'react';

export function useRowSelection<TId>(getId: (x: any) => TId) {
    const [selected, setSelected] = useState<TId[]>([]);

    const isAllSelected = false;       // (enable when you allow multi-select-all)
    const isIndeterminate = false;     // (ditto)

    const hasSelection = selected.length > 0;
    const selectedId = selected[0] ?? null;

    const toggleOne = (id: TId) => {
        setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [id]));
    };

    const toggleAll = () => { }; // noop for now (your UI disables it)

    return { selected, setSelected, hasSelection, isAllSelected, isIndeterminate, selectedId, toggleOne, toggleAll };
}
