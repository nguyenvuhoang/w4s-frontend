'use client'

import { createContext, useContext, useState, useCallback } from "react";

type RowSelectionContextType = {
  selectedRows: Set<any>;
  addRow: (row: any) => void;
  removeRow: (row: any) => void;
  getSelectedRows: () => any[];
  isRowSelected: (row: any) => boolean;
};

const RowSelectionContext = createContext<RowSelectionContextType | undefined>(undefined);

export const RowSelectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());

  const addRow = useCallback((row: any) => {
    setSelectedRows(prev => new Set([...prev, row]));
  }, []);

  const removeRow = useCallback((row: any) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(row);
      return newSet;
    });
  }, []);

  const isRowSelected = useCallback((row: any) => {
    return selectedRows.has(row);
  }, [selectedRows]);

  const getSelectedRows = useCallback(() => Array.from(selectedRows), [selectedRows]);

  return (
    <RowSelectionContext.Provider value={{ selectedRows, addRow, removeRow, getSelectedRows, isRowSelected }}>
      {children}
    </RowSelectionContext.Provider>
  );
};

export const useRowSelection = () => {
  const context = useContext(RowSelectionContext);
  if (!context) {
    throw new Error("useRowSelection must be used within RowSelectionProvider");
  }
  return context;
};
