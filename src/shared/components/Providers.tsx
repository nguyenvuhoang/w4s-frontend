import LocalizationProviders from "@/@core/providers/localization-provider";
import { ChildrenType } from "@/@core/types";
import { getMode, getSettingsFromCookie, getSystemMode } from "@/@core/utils/serverHelpers";
import { VerticalNavProvider } from "@/@menu/contexts/verticalNavContext";
import { GlobalProvider } from "@contexts/GlobalContext";
import { NextAuthProvider } from "@contexts/nextAuthProvider";
import { AppProvider, type AppUserInfo } from "@contexts/AppContext";
import { SettingsProvider } from '@core/contexts/settingsContext';
import type { VerticalSubMenuDataType } from "@shared/types/menuTypes";
import { PermissionProvider } from "@shared/permissions/PermissionProvider";
import { getBrandingSettings } from "@shared/services/brandingSettingsService";

import { RowSelectionProvider } from "@contexts/RowSelectionContext";
import ProgressBarProgress from "./progressbar";
import ThemeProvider from "./theme";
import ClientSessionHandler from "./ClientSessionHandler";
import ConsoleSecurityWarning from "./ConsoleSecurityWarning";
import DynamicFavicon from "./DynamicFavicon";


type Props = ChildrenType & {
    initialAvatar: string | null;
    initialUserInfo?: AppUserInfo | null;
    initialMenuData?: VerticalSubMenuDataType[];
}

const Providers = async (props: Props) => {
    // Props
    const { children, initialAvatar, initialUserInfo = null, initialMenuData = [] } = props
    const settingsCookie = await getSettingsFromCookie()
    const mode = await getMode()
    const systemMode = await getSystemMode()
    const brandingSettings = await getBrandingSettings()

    return (
        <NextAuthProvider>
            <VerticalNavProvider>
                <AppProvider initialUserInfo={initialUserInfo} initialMenuData={initialMenuData}>
                    <PermissionProvider>
                        <SettingsProvider settingsCookie={settingsCookie} mode={mode} brandingSettings={brandingSettings}>
                            <GlobalProvider initialAvatar={initialAvatar}>
                                <RowSelectionProvider>
                                    <ThemeProvider systemMode={systemMode}>
                                        <LocalizationProviders>
                                            <ProgressBarProgress>
                                                <ConsoleSecurityWarning />
                                                <ClientSessionHandler />
                                                <DynamicFavicon />
                                                {children}
                                            </ProgressBarProgress>
                                        </LocalizationProviders>
                                    </ThemeProvider>
                                </RowSelectionProvider>
                            </GlobalProvider>
                        </SettingsProvider>
                    </PermissionProvider>
                </AppProvider>
            </VerticalNavProvider>
        </NextAuthProvider>
    )
}
export default Providers

