'use client'

import type { SyntheticEvent } from 'react'

import DescriptionIcon from '@mui/icons-material/Description'
import SyncIcon from '@mui/icons-material/Sync'
import { Alert, Box, Button, Stack, Tab, Tabs } from '@mui/material'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { getLocalizedText } from '@/shared/utils/getLocalizedText'

import FormBuilderTab from './components/builder/FormBuilderTab'
import FormTemplateHeader from './components/detail/FormTemplateHeader'
import GeneralInfoTab from './components/detail/GeneralInfoTab'
import PrintConfigTab from './components/detail/PrintConfigTab'
import VersionHistoryTab from './components/detail/VersionHistoryTab'
import FormPreviewTab from './components/preview/FormPreviewTab'
import { commonText, formTemplateText, getFormTemplateVersionStatusColor, getFormTemplateVersionStatusLabel } from './formTemplateHelpers'
import { useFormTemplateVersions } from './hooks/useFormTemplateVersions'
import { useFormValues } from './renderer/useFormValues'
import type { FormTemplateDetailModel, FormTemplateDictionary } from './types'

type TabKey = 'general' | 'builder' | 'preview' | 'print' | 'versions'

const TAB_KEYS: TabKey[] = ['general', 'builder', 'preview', 'print', 'versions']

const isTabKey = (value: string | null): value is TabKey => TAB_KEYS.includes(value as TabKey)

type Props = {
  dictionary: FormTemplateDictionary
  locale: Locale
  formTemplateId: number
  initialFormTemplate: FormTemplateDetailModel | null
  initialError?: string | null
}

const FormTemplateDetailPage = ({ dictionary, locale, formTemplateId, initialFormTemplate, initialError }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const activeTab: TabKey = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'general'

  const goToTab = (value: TabKey) => {
    const params = new URLSearchParams(searchParams.toString())

    params.set('tab', value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleTabChange = (_: SyntheticEvent, value: TabKey) => goToTab(value)

  if (initialError || !initialFormTemplate) {
    return (
      <ContentWrapper
        title={formTemplateText(dictionary, 'formTemplateDetail', 'Chi tiết biểu mẫu')}
        description=""
        icon={<DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
        dictionary={dictionary}
      >
        <Stack spacing={2} sx={{ mt: 3, alignItems: 'flex-start' }}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {initialError || formTemplateText(dictionary, 'formTemplateNotFound', 'Không tìm thấy biểu mẫu.')}
          </Alert>
        </Stack>
      </ContentWrapper>
    )
  }

  return (
    <FormTemplateDetailContent
      dictionary={dictionary}
      locale={locale}
      sessiontoken={session?.user?.token ?? undefined}
      formTemplate={initialFormTemplate}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onGoToTab={goToTab}
      onBack={() => router.push(`/${locale}/e-form/form-management`)}
    />
  )
}

const FormTemplateDetailContent = ({
  dictionary,
  locale,
  sessiontoken,
  formTemplate,
  activeTab,
  onTabChange,
  onGoToTab,
  onBack
}: {
  dictionary: FormTemplateDictionary
  locale: Locale
  sessiontoken?: string
  formTemplate: FormTemplateDetailModel
  activeTab: TabKey
  onTabChange: (event: SyntheticEvent, value: TabKey) => void
  onGoToTab: (value: TabKey) => void
  onBack: () => void
}) => {
  const versions = useFormTemplateVersions({ dictionary, sessiontoken, language: locale, template: formTemplate })
  const templateName = getLocalizedText(formTemplate.name, locale)
  // Chưa có workflow trả về tên dự án (chỉ có project_id) — để undefined, binding demo tự fallback "Dự án mẫu".
  const preview = useFormValues(versions.dataSchema, locale, undefined)

  const versionLabel = versions.isLegacyMode
    ? formTemplateText(dictionary, 'legacySchemaLabel', 'Schema cũ (chưa có version)')
    : versions.versionDetail
      ? `v${versions.versionDetail.version_no}`
      : '-'

  const statusLabel = versions.isLegacyMode
    ? formTemplateText(dictionary, 'statusUnknown', 'Không xác định')
    : versions.versionDetail
      ? getFormTemplateVersionStatusLabel(dictionary, versions.versionDetail.status)
      : '-'

  const statusColor = versions.isLegacyMode ? 'default' : versions.versionDetail ? getFormTemplateVersionStatusColor(versions.versionDetail.status) : 'default'

  return (
    <ContentWrapper
      title={templateName || formTemplate.form_code}
      description={formTemplate.form_code}
      icon={<DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <FormTemplateHeader
          dictionary={dictionary}
          templateName={templateName || formTemplate.form_code}
          formCode={formTemplate.form_code}
          versionLabel={versionLabel}
          statusLabel={statusLabel}
          statusColor={statusColor}
          dirty={versions.dirty}
          saving={versions.saving}
          publishing={versions.publishing}
          creatingVersion={versions.creatingVersion}
          isReadOnly={versions.isReadOnly}
          isLegacyMode={versions.isLegacyMode}
          onBack={onBack}
          onSaveDraft={() => void versions.saveDraft()}
          onGoToPreview={() => onGoToTab('preview')}
          onPublish={() => void versions.publish()}
          onCreateNewVersion={() => void versions.createNewVersionFromCurrent()}
        />

        {versions.detailError && (
          <WorkflowErrorAlert
            title={formTemplateText(dictionary, 'versionDetailLoadError', 'Không thể tải chi tiết phiên bản.')}
            description={versions.detailError.message}
            executionId={versions.detailError.executionId}
            technicalDetails={versions.detailError.technicalDetails}
            referenceLabel={commonText(dictionary, 'errorReference', 'Mã tra cứu lỗi')}
            copyLabel={commonText(dictionary, 'copyErrorReference', 'Sao chép mã tra cứu')}
            copySuccessMessage={commonText(dictionary, 'copiedErrorReference', 'Đã sao chép mã tra cứu')}
            technicalDetailsLabel={commonText(dictionary, 'technicalDetails', 'Chi tiết kỹ thuật')}
          />
        )}

        {!versions.isReadOnly && versions.schemaOutOfSync && (
          <Alert
            severity="info"
            action={(
              <Button color="inherit" size="small" startIcon={<SyncIcon />} onClick={versions.syncFieldsFromSchemaJson}>
                {formTemplateText(dictionary, 'syncSchemaButton', 'Đồng bộ field từ schema_json')}
              </Button>
            )}
          >
            {formTemplateText(dictionary, 'schemaOutOfSyncNotice', 'Mã biểu mẫu (schema_json) hiện có nhiều field hơn phiên bản đang chỉnh sửa. Bấm để đưa field mới vào biểu mẫu, sau đó nhớ Lưu bản nháp.')}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={onTabChange} variant="scrollable" scrollButtons="auto">
            <Tab value="general" label={formTemplateText(dictionary, 'tabGeneralInfo', 'Thông tin chung')} />
            <Tab value="builder" label={formTemplateText(dictionary, 'tabBuilder', 'Thiết kế biểu mẫu')} />
            <Tab value="preview" label={formTemplateText(dictionary, 'tabPreview', 'Xem trước')} />
            <Tab value="print" label={formTemplateText(dictionary, 'tabPrint', 'Cấu hình/Bản in')} />
            <Tab value="versions" label={formTemplateText(dictionary, 'tabVersions', 'Lịch sử phiên bản')} />
          </Tabs>
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 'general'}>
          {activeTab === 'general' && <GeneralInfoTab dictionary={dictionary} locale={locale} formTemplate={formTemplate} />}
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 'builder'}>
          {activeTab === 'builder' && (
            <FormBuilderTab
              dictionary={dictionary}
              locale={locale}
              dataSchema={versions.dataSchema}
              uiSchema={versions.uiSchema}
              setDataSchema={versions.setDataSchema}
              setUiSchema={versions.setUiSchema}
              readOnly={versions.isReadOnly}
            />
          )}
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 'preview'}>
          {activeTab === 'preview' && (
            <FormPreviewTab
              dictionary={dictionary}
              locale={locale}
              sessiontoken={sessiontoken}
              projectId={formTemplate.project_id}
              dataSchema={versions.dataSchema}
              uiSchema={versions.uiSchema}
              preview={preview}
            />
          )}
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 'print'}>
          {activeTab === 'print' && (
            <PrintConfigTab
              dictionary={dictionary}
              locale={locale}
              formName={templateName || formTemplate.form_code}
              formCode={formTemplate.form_code}
              versionLabel={versionLabel}
              projectName={undefined}
              dataSchema={versions.dataSchema}
              uiSchema={versions.uiSchema}
              printSchema={versions.printSchema}
              setPrintSchema={versions.setPrintSchema}
              values={preview.values}
              readOnly={versions.isReadOnly}
            />
          )}
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 'versions'}>
          {activeTab === 'versions' && (
            <VersionHistoryTab
              dictionary={dictionary}
              locale={locale}
              versions={versions.versions}
              versionsLoading={versions.versionsLoading}
              versionsError={versions.versionsError}
              selectedVersionNo={versions.selectedVersionNo}
              versionDetail={versions.versionDetail}
              detailLoading={versions.detailLoading}
              isLegacyMode={versions.isLegacyMode}
              onSelectVersion={versions.selectVersion}
            />
          )}
        </Box>
      </Stack>
    </ContentWrapper>
  )
}

export default FormTemplateDetailPage
