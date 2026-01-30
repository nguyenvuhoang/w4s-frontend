import LocalizationProviders from "@/@core/providers/localization-provider";
import { ChildrenType } from "@/@core/types";
import { getMode, getSettingsFromCookie, getSystemMode } from "@/@core/utils/serverHelpers";
import { VerticalNavProvider } from "@/@menu/contexts/verticalNavContext";
import { GlobalProvider } from "@contexts/GlobalContext";
import { NextAuthProvider } from "@contexts/nextAuthProvider";
import { SettingsProvider } from '@core/contexts/settingsContext';

import { RowSelectionProvider } from "@contexts/RowSelectionContext";
import ProgressBarProgress from "./progressbar";
import ThemeProvider from "./theme";
import ClientSessionHandler from "./ClientSessionHandler";


type Props = ChildrenType & {
    initialAvatar: string | null;
}

const Providers = async (props: Props) => {
    // Props
    const { children, initialAvatar } = props
    const settingsCookie = await getSettingsFromCookie()
    const mode = await getMode()
    const systemMode = await getSystemMode()

    return (
        <NextAuthProvider>
            <VerticalNavProvider>
                <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
                    <GlobalProvider initialAvatar={initialAvatar}>
                        <RowSelectionProvider>
                            <ThemeProvider systemMode={systemMode}>
                                <LocalizationProviders>
                                    <ClientSessionHandler />
                                    {children}
                                </LocalizationProviders>
                            </ThemeProvider>
                        </RowSelectionProvider>
                        <ProgressBarProgress />
                    </GlobalProvider>
                </SettingsProvider>
            </VerticalNavProvider>
        </NextAuthProvider>
    )
}
export default Providers

