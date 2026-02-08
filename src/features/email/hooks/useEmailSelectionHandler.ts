'use client';

import { useState, useMemo } from 'react';

export const useEmailSelectionHandler = (emails: any[]) => {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

    const isAllSelected = useMemo(() => {
        return emails.length > 0 && selectedIds.size === emails.length;
    }, [emails, selectedIds]);

    const isSomeSelected = useMemo(() => {
        return selectedIds.size > 0 && selectedIds.size < emails.length;
    }, [emails, selectedIds]);

    const getEmailId = (email: any) => email.id ?? email.Id ?? email.ID;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            const allIds = emails.map((email) => getEmailId(email));
            setSelectedIds(new Set(allIds));
        }
    };

    const toggleSelect = (id: string | number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const clearSelection = () => setSelectedIds(new Set());

    const isSelected = (id: string | number) => selectedIds.has(id);

    return {
        selectedIds,
        isAllSelected,
        isSomeSelected,
        toggleSelectAll,
        toggleSelect,
        isSelected,
        clearSelection,
        getEmailId
    };
};
