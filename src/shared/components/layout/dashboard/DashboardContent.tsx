'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { useRouter } from '@shared/hooks/useRouter'

import HorizontalLayout from '@/@layouts/HorizontalLayout'
import LayoutWrapper from '@/@layouts/LayoutWrapper'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import HeaderHorizontal from '@components/layout/horizontal/Header'
import DashboardShell from '@components/layout/dashboard/DashboardShell'
import ErrorPage from '@/views/Error'

import type { Locale } from '@/configs/i18n'
import { InitUserStore } from '@/@core/stores/InitUserStore'
import {
  useMenuScope,
  useWorkingProjectAttempt,
  useWorkingProjectDiagnostic,
  useWorkingProjectRetrying,
  useWorkingProjectStatus,
  useWorkingProjectStore
} from '@/@core/stores/useWorkingProjectStore'
import { useAppContext } from '@contexts/AppContext'
import { useDashboardMenu } from '@/shared/hooks/useDashboardMenu'
import ProjectContextBanner from '@/shared/components/project-context/ProjectContextBanner'
import ProjectContextLoading from '@/shared/components/project-context/ProjectContextLoading'
import WorkspaceBootErrorState from '@/shared/components/project-context/WorkspaceBootErrorState'
import { getLocalizedUrl } from '@utils/i18n'
import type { RoleChannel, UserInRole } from '@shared/types/systemTypes'
import { navTrace } from '@/shared/utils/navigationDebug'

type Props = {
  dictionary: any
  locale: Locale
  sessiontoken: string
  avatar: string
  name: string
  role: UserInRole[]
  roleChannel: RoleChannel[]
  children: ReactNode
}

/**
 * Owns the whole boot sequence for dashboard chrome: restore session -> resolve ProjectContext
 * (WF_BO_GET_BO_CONTEXT, empty scope) -> if not READY, bounce to /select-project without ever
 * rendering sidebar/header/menu. Once READY (scope known), DashboardShell/HorizontalLayout mount
 * immediately and menu loads independently inside them (see ReadyDashboard) — a slow/failed menu
 * fetch must never look like a stuck ProjectContext, and must never tear the shell down again.
 *
 * Menu is intentionally fetched here (client-side, post-READY) rather than via the old
 * SSR-in-layout fetch, because menu permissions can depend on the selected project's scope —
 * an SSR fetch has no way to know which project a given browser/user has picked.
 */
const DashboardContent = ({ dictionary, locale, sessiontoken, avatar, name, role, roleChannel, children }: Props) => {
  const router = useRouter()
  const projectStatus = useWorkingProjectStatus()
  const projectRetrying = useWorkingProjectRetrying()
  const projectDiagnostic = useWorkingProjectDiagnostic()
  const projectAttempt = useWorkingProjectAttempt()

  // A missing sessiontoken is no longer skipped silently (that left the boot loader spinning
  // forever with no request ever sent): initialize() turns it into a visible SESSION_CHECK error.
  useEffect(() => {
    if (useWorkingProjectStore.getState().status !== 'LOADING') return

    void useWorkingProjectStore.getState().initialize({ sessiontoken, language: locale })
  }, [sessiontoken, locale])

  useEffect(() => {
    if (projectStatus === 'REQUIRE_SELECTION' || projectStatus === 'NO_PROJECT_ACCESS') {
      router.replace(getLocalizedUrl('/select-project', locale))
    }
  }, [projectStatus, router, locale])

  useEffect(() => {
    navTrace('dashboard:projectStatus', { projectStatus })
  }, [projectStatus])

  useEffect(() => {
    navTrace('dashboard:DashboardContent mount')

    return () => navTrace('dashboard:DashboardContent unmount')
  }, [])

  // Bootstrap failed (any stage: session marker, BFF, WF_BO_GET_BO_CONTEXT, project scope sync).
  // One recovery screen for both availability (SERVICE_UNAVAILABLE) and other failures (ERROR):
  // the session is never logged out from here automatically — "Sign in again" is an explicit user
  // action — and the boot effect above only fires from LOADING, so nothing re-requests on its own;
  // only the Retry button does (deduped by the store while a request is in flight).
  if (projectStatus === 'SERVICE_UNAVAILABLE' || projectStatus === 'ERROR') {
    return (
      <WorkspaceBootErrorState
        dictionary={dictionary}
        locale={locale}
        diagnostic={projectDiagnostic}
        attempt={projectAttempt}
        retrying={projectRetrying}
        onRetry={() => void useWorkingProjectStore.getState().initialize({ sessiontoken, language: locale })}
        onSignInAgain={() => router.replace(getLocalizedUrl('/logout', locale))}
      />
    )
  }

  // LOADING, REQUIRE_SELECTION and NO_PROJECT_ACCESS all render nothing but a bare loading
  // screen here — no DashboardShell, no menu, no sidebar/header. The latter two are mid-redirect
  // to /select-project (effect above); showing chrome for that instant would be exactly the bug
  // this component exists to prevent.
  if (projectStatus !== 'READY') {
    return <ProjectContextLoading dictionary={dictionary} />
  }

  return (
    <ReadyDashboard
      dictionary={dictionary}
      locale={locale}
      sessiontoken={sessiontoken}
      avatar={avatar}
      name={name}
      role={role}
      roleChannel={roleChannel}
    >
      {children}
    </ReadyDashboard>
  )
}

const ReadyDashboard = ({ dictionary, locale, sessiontoken, avatar, name, role, roleChannel, children }: Props) => {
  const { setMenuData } = useAppContext()
  const menuScope = useMenuScope()
  const { status: menuStatus, menu, error: menuError } = useDashboardMenu({
    sessiontoken,
    language: locale,
    menuScope
  })

  // If this logs "mounted" more than once for a single project selection, ReadyDashboard is being
  // torn down and rebuilt — projectStatus flickered away from READY and back, which also cancels
  // and restarts the menu fetch in useDashboardMenu, and would explain an overlay that never closes.
  useEffect(() => {
    navTrace('dashboard:ReadyDashboard mount')

    return () => navTrace('dashboard:ReadyDashboard unmount')
  }, [])

  // This is the single source of truth for the project-scoped WF_BO_LOAD_MENU tree: push it into
  // AppContext so PermissionProvider (which only reads AppContext.menuData, never this hook's local
  // state) resolves canView/canAdd/... from the exact same data the sidebar renders. Without this,
  // AppContext.menuData is only ever filled by PermissionProvider's own project-scope-unaware
  // fallback fetch, which races ahead of ProjectContext readiness and can leave permissions stuck
  // denied even though the visible menu (sourced from this hook via the `menudata` prop fallback in
  // DashboardShell) looks correct.
  //
  // The `loading` branch matters just as much as `ready`: useDashboardMenu resets to `loading`/
  // `menu: []` the instant menuScope changes (project switch), and that reset has to reach
  // AppContext.menuData in the same instant too — otherwise PermissionProvider keeps resolving
  // canView/canAdd/... from the OLD project's menu tree for however long the new project's fetch
  // takes, even though the sidebar itself has already gone empty. Clearing menuData here also
  // re-arms PermissionProvider's own fallback (its guard is `menuData.length > 0`), so both
  // consumers correctly race for the new scope together — deduped to one request by menuService's
  // existing single-flight cache, same as on the initial load.
  useEffect(() => {
    if (menuStatus === 'ready' && menu.length > 0) {
      setMenuData(menu)
    } else if (menuStatus === 'loading') {
      setMenuData([])
    }
  }, [menuStatus, menu, setMenuData])

  useEffect(() => {
    navTrace('dashboard:menuStatus', { menuStatus })
  }, [menuStatus])

  // ProjectContext is already READY at this point — the dashboard shell must render regardless of
  // how long/whether the menu fetch takes. Blocking the whole page behind SyncOverlay again here
  // (as before) meant a stuck/slow WF_BO_LOAD_MENU call looked identical to a stuck ProjectContext,
  // and tied the shell's mount/unmount to menuStatus flips — a needless remount source. The menu
  // area simply renders empty until `menu` arrives; a hard menu failure still needs a real error
  // screen since without menu there is nothing to navigate to.
  if (menuStatus === 'error') {
    return <ErrorPage error={menuError ?? 'Unable to load menu.'} side="client" />
  }

  return (
    <LayoutWrapper
      verticalLayout={
        <DashboardShell dictionary={dictionary} menudata={menu}>
          <InitUserStore name={name} avatar={avatar} role={role} />
          <ProjectContextBanner dictionary={dictionary} />
          {children}
        </DashboardShell>
      }
      horizontalLayout={
        <HorizontalLayout
          header={
            <HeaderHorizontal menu={menu} avatar={avatar} name={name} dictionary={dictionary} roleChannel={roleChannel} />
          }
          footer={<HorizontalFooter />}
        >
          <InitUserStore name={name} avatar={avatar} role={role} />
          <ProjectContextBanner dictionary={dictionary} />
          {children}
        </HorizontalLayout>
      }
    />
  )
}

export default DashboardContent
