"use client";

import type { VerticalSubMenuDataType } from "@shared/types/menuTypes";
import type { SystemData } from "@shared/types/systemTypes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type AppUserInfo = SystemData;

type AppContextValue = {
  userInfo: AppUserInfo | null;
  menuData: VerticalSubMenuDataType[];
  isLoaded: boolean;
  setUserInfo: (info: AppUserInfo | null) => void;
  setMenuData: (data: VerticalSubMenuDataType[]) => void;
  setAppData: (data: { userInfo?: AppUserInfo | null; menuData?: VerticalSubMenuDataType[] }) => void;
  clearAppData: () => void;
};

type AppProviderProps = {
  children: ReactNode;
  initialUserInfo?: AppUserInfo | null;
  initialMenuData?: VerticalSubMenuDataType[];
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialUserInfo = null,
  initialMenuData = []
}: AppProviderProps) {
  const [userInfo, setUserInfoState] = useState<AppUserInfo | null>(initialUserInfo);
  const [menuData, setMenuDataState] = useState<VerticalSubMenuDataType[]>(initialMenuData);

  useEffect(() => {
    setUserInfoState(initialUserInfo);
  }, [initialUserInfo]);

  useEffect(() => {
    setMenuDataState(initialMenuData);
  }, [initialMenuData]);

  const setUserInfo = useCallback((info: AppUserInfo | null) => {
    setUserInfoState(info);
  }, []);

  const setMenuData = useCallback((data: VerticalSubMenuDataType[]) => {
    setMenuDataState(data);
  }, []);

  const setAppData = useCallback(
    ({ userInfo, menuData }: { userInfo?: AppUserInfo | null; menuData?: VerticalSubMenuDataType[] }) => {
      if (userInfo !== undefined) setUserInfoState(userInfo);
      if (menuData !== undefined) setMenuDataState(menuData);
    },
    []
  );

  const clearAppData = useCallback(() => {
    setUserInfoState(null);
    setMenuDataState([]);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      userInfo,
      menuData,
      isLoaded: Boolean(userInfo) && menuData.length > 0,
      setUserInfo,
      setMenuData,
      setAppData,
      clearAppData
    }),
    [clearAppData, menuData, setAppData, setMenuData, setUserInfo, userInfo]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }

  return context;
}
