import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjectCreatePayload } from '../types'

const { runFODynamic, captured } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  captured: [] as Array<{ name: string; props: Record<string, any> }>
}))

// The shared Province lookup (Autocomplete + master workflow) is covered by projectProvinceForm.test.ts.
vi.mock('./province/ProvinceSelect', async () => {
  const { createElement: h } = await import('react')

  return { default: ({ label }: { label: string }) => h('span', { 'data-province-select': true }, label) }
})
vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const make = (name: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return {
    Alert: make('Alert'), Box: make('Box'), Button: make('Button'), Divider: make('Divider'), Grid: make('Grid'), MenuItem: make('MenuItem'),
    Paper: make('Paper'), Stack: make('Stack'), TextField: make('TextField'), Typography: make('Typography')
  }
})
vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))
vi.mock('@mui/icons-material/AccountBalanceOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SavingsOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Close', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ZoomIn', () => ({ default: () => null }))
vi.mock('@mui/icons-material/AddCircleOutline', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Apartment', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Cancel', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Domain', () => ({ default: () => null }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))

let service: typeof import('../propertyAggregateService')
let rules: typeof import('./logo/projectLogoRules')
let ProjectCreatePage: typeof import('./ProjectCreatePage').default
let ProjectLogoUpload: typeof import('./logo/ProjectLogoUpload').default

beforeAll(async () => {
  service = await import('../propertyAggregateService')
  rules = await import('./logo/projectLogoRules')
    ; ({ default: ProjectCreatePage } = await import('./ProjectCreatePage'))
    ; ({ default: ProjectLogoUpload } = await import('./logo/ProjectLogoUpload'))
})

const fetchMock = vi.fn()

beforeEach(() => {
  runFODynamic.mockReset()
  fetchMock.mockReset()
  captured.length = 0
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const UPLOADED_LOGO_URL = 'https://minio.local/ips-documents/project-logos/new/2026/09/abc.png'

const presignOk = () => ({
  ok: true,
  json: async () => ({
    success: true,
    data: { upload_url: 'https://minio.local/presigned-put', object_key: 'project-logos/new/2026/09/abc.png', logo_url: UPLOADED_LOGO_URL }
  })
})

const logoFile = (name = 'logo.png', type = 'image/png', size = 1024) => (
  new File([new Uint8Array(size)], name, { type })
)

const payload: Omit<ProjectCreatePayload, 'logo_url'> = {
  name: 'Demo name',
  province: 'Ho Chi Minh',
  address: '512 Nguyen Xien',
  handover_date: null,
  investor: 'Vinhomes',
  project_code: 'PRJ99',
  description: 'Demo description',
  operating_bank_account: { bank_name: '', account_number: '', account_holder: '', transfer_content: '' },
  deposit_bank_account: { bank_name: '', account_number: '', account_holder: '', transfer_content: '' }
}

const createOk = { success: true, code: 'success', data: { project: { id: 15, project_code: 'PRJ99', name: 'Demo name' } }, errors: [] }

describe('project logo file validation', () => {
  it('uses the real upload limit of the logo presign route', () => {
    expect(rules.PROJECT_LOGO_MAX_SIZE_BYTES).toBe(5 * 1024 * 1024)
    expect(rules.getProjectLogoMaxSizeMb()).toBe(5)
  })

  it('accepts supported images within the limit', () => {
    expect(rules.validateProjectLogoFile({ name: 'a.PNG', type: 'image/png', size: 1000 })).toBeNull()
    expect(rules.validateProjectLogoFile({ name: 'a.jpeg', type: 'image/jpeg', size: rules.PROJECT_LOGO_MAX_SIZE_BYTES })).toBeNull()
    expect(rules.validateProjectLogoFile({ name: 'a.webp', type: 'image/webp', size: 1000 })).toBeNull()
  })

  it('rejects non-image files', () => {
    expect(rules.validateProjectLogoFile({ name: 'a.pdf', type: 'application/pdf', size: 1000 })).toBe('type')
    expect(rules.validateProjectLogoFile({ name: 'a.gif', type: 'image/gif', size: 1000 })).toBe('type')
    expect(rules.validateProjectLogoFile({ name: 'a.png', type: 'text/plain', size: 1000 })).toBe('type')
  })

  it('rejects files over the maximum size', () => {
    expect(rules.validateProjectLogoFile({ name: 'a.png', type: 'image/png', size: rules.PROJECT_LOGO_MAX_SIZE_BYTES + 1 })).toBe('size')
  })
})

describe('create_project_with_logo', () => {
  it('uploads through the MinIO presign route without a project id, then creates with the uploaded URL', async () => {
    fetchMock.mockResolvedValueOnce(presignOk()).mockResolvedValueOnce({ ok: true })
    runFODynamic.mockResolvedValue(createOk)

    const file = logoFile()
    const created = await service.propertyAggregateService.create_project_with_logo({ sessiontoken: 'token', payload, logo_file: file })

    const [presignUrl, presignInit] = fetchMock.mock.calls[0]
    const presignBody = JSON.parse(presignInit.body)

    expect(presignUrl).toBe('/api/projects/logo/presign-upload')
    expect(presignBody).toEqual({ file_name: 'logo.png', content_type: 'image/png', file_size: 1024 })
    expect(presignBody).not.toHaveProperty('project_id')

    const [putUrl, putInit] = fetchMock.mock.calls[1]

    expect(putUrl).toBe('https://minio.local/presigned-put')
    expect(putInit.method).toBe('PUT')
    expect(putInit.body).toBe(file)

    const request = runFODynamic.mock.calls[0][0]

    expect(request.workflowid).toBe('WF_BO_CREATE_PROJECT')
    expect(request.input.logo_url).toBe(UPLOADED_LOGO_URL)
    expect(created?.id).toBe(15)
  })

  it('sends exactly the 8 project fields + the 2 bank objects, no File, base64 or blob URL', async () => {
    fetchMock.mockResolvedValueOnce(presignOk()).mockResolvedValueOnce({ ok: true })
    runFODynamic.mockResolvedValue(createOk)

    await service.propertyAggregateService.create_project_with_logo({ sessiontoken: 'token', payload, logo_file: logoFile() })

    const input = runFODynamic.mock.calls[0][0].input

    expect(Object.keys(input).sort()).toEqual([
      'address', 'deposit_bank_account', 'description', 'handover_date', 'investor', 'logo_url', 'name', 'operating_bank_account', 'project_code', 'province'
    ])
    expect(input.handover_date).toBeNull()

    for (const [key, value] of Object.entries(input)) {
      if (key === 'handover_date' || key.endsWith('_bank_account')) continue
      expect(typeof value).toBe('string')
      expect(value as string).not.toMatch(/^(data:|blob:)/)
    }
  })

  it('creates with an empty logo_url and no upload when no image is selected (or it was removed)', async () => {
    runFODynamic.mockResolvedValue(createOk)

    await service.propertyAggregateService.create_project_with_logo({ sessiontoken: 'token', payload, logo_file: null })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(runFODynamic.mock.calls[0][0].input.logo_url).toBe('')
  })

  it('does not call WF_BO_CREATE_PROJECT when getting the upload URL fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ success: false, message: 'MinIO is not configured.' }) })

    await expect(service.propertyAggregateService.create_project_with_logo({ sessiontoken: 'token', payload, logo_file: logoFile() }))
      .rejects.toBeInstanceOf(service.ProjectLogoUploadError)
    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('does not call WF_BO_CREATE_PROJECT when the MinIO upload itself fails', async () => {
    fetchMock.mockResolvedValueOnce(presignOk()).mockResolvedValueOnce({ ok: false, status: 403 })

    await expect(service.propertyAggregateService.create_project_with_logo({ sessiontoken: 'token', payload, logo_file: logoFile() }))
      .rejects.toThrow('Upload logo failed (403).')
    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('tags a failed storage PUT (no response) as a network failure, not a specific cause', async () => {
    fetchMock.mockResolvedValueOnce(presignOk()).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const error = await service.propertyAggregateService.upload_project_logo({ file: logoFile() }).catch(err => err)

    expect(error).toBeInstanceOf(service.ProjectLogoUploadError)
    expect(error.reason).toBe('network')
  })

  it('tags a non-2xx storage answer with its status, and a presign refusal as presign', async () => {
    fetchMock.mockResolvedValueOnce(presignOk()).mockResolvedValueOnce({ ok: false, status: 403 })
    const storageError = await service.propertyAggregateService.upload_project_logo({ file: logoFile() }).catch(err => err)

    expect(storageError.reason).toBe('storage')
    expect(storageError.status).toBe(403)

    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ success: false, message: 'File logo không hợp lệ.' }) })
    const presignError = await service.propertyAggregateService.upload_project_logo({ file: logoFile() }).catch(err => err)

    expect(presignError.reason).toBe('presign')
    expect(presignError.message).toBe('File logo không hợp lệ.')
  })

  it('edit keeps sending the project id to the same upload route', async () => {
    fetchMock.mockResolvedValueOnce(presignOk()).mockResolvedValueOnce({ ok: true })

    const url = await service.propertyAggregateService.upload_project_logo({ projectId: 7, file: logoFile() })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).project_id).toBe(7)
    expect(url).toBe(UPLOADED_LOGO_URL)
  })
})

const dictionary = {
  projectManagement: {
    imageUrl: 'URL hình ảnh',
    projectLogo: 'Logo dự án',
    logoChooseImage: 'Chọn ảnh',
    logoChangeImage: 'Thay đổi ảnh',
    logoRemoveImage: 'Xóa ảnh',
    logoUploadHint: 'Định dạng hỗ trợ: {formats}. Dung lượng tối đa: {maxSize} MB.'
  },
  common: {}
} as any

describe('ProjectCreatePage logo field', () => {
  it('replaces the "URL hình ảnh" input with the logo upload and its note', () => {
    const html = renderToStaticMarkup(createElement(ProjectCreatePage, { dictionary, locale: 'vi', sessiontoken: 'token' }))

    expect(html).not.toContain('URL hình ảnh')
    expect(html).toContain('Logo dự án')
    expect(html).toContain('Chọn ảnh')
    expect(html).toContain('Định dạng hỗ trợ: JPG, JPEG, PNG, WEBP. Dung lượng tối đa: 5 MB.')
    // No image selected yet: nothing to remove.
    expect(html).not.toContain('Xóa ảnh')
  })
})

describe('ProjectLogoUpload', () => {
  it('offers change/remove for a selected image and reports remove', () => {
    const onRemove = vi.fn()
    const html = renderToStaticMarkup(createElement(ProjectLogoUpload, {
      dictionary,
      imageUrl: 'blob:preview',
      hasSelectedFile: true,
      error: null,
      onSelect: vi.fn(),
      onRemove
    }))

    expect(html).toContain('Thay đổi ảnh')
    expect(html).toContain('Xóa ảnh')

    const removeButton = captured.filter(item => item.name === 'Button').find(item => item.props.onClick)!

    removeButton.props.onClick()
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('shows the validation error under the field', () => {
    const html = renderToStaticMarkup(createElement(ProjectLogoUpload, {
      dictionary,
      imageUrl: null,
      hasSelectedFile: false,
      error: 'File vượt quá dung lượng cho phép (5 MB).',
      onSelect: vi.fn(),
      onRemove: vi.fn()
    }))

    expect(html).toContain('File vượt quá dung lượng cho phép (5 MB).')
  })
})

describe('projectLogoUploadErrorMessage', () => {
  const messages = {
    projectManagement: {
      logoUploadFailed: 'Tải ảnh thất bại.',
      logoUploadNetworkError: 'Không kết nối được tới máy chủ lưu trữ ảnh.',
      logoUploadStorageError: 'Máy chủ lưu trữ ảnh từ chối tải lên (mã {status}).'
    },
    common: {}
  } as any

  it('maps each failure reason to its own message, keeping the upload-failed prefix', async () => {
    const { projectLogoUploadErrorMessage } = await import('./logo/useProjectLogoFile')
    const { ProjectLogoUploadError } = service

    expect(projectLogoUploadErrorMessage(messages, new ProjectLogoUploadError('Failed to fetch', 'network')))
      .toBe('Tải ảnh thất bại. Không kết nối được tới máy chủ lưu trữ ảnh.')
    expect(projectLogoUploadErrorMessage(messages, new ProjectLogoUploadError('Upload logo failed (403).', 'storage', 403)))
      .toBe('Tải ảnh thất bại. Máy chủ lưu trữ ảnh từ chối tải lên (mã 403).')
    expect(projectLogoUploadErrorMessage(messages, new ProjectLogoUploadError('File logo không hợp lệ.')))
      .toBe('Tải ảnh thất bại. File logo không hợp lệ.')
  })
})

describe('ProjectLogoUpload dimension hint', () => {
  it('shows the recommended size as guidance only', () => {
    const html = renderToStaticMarkup(createElement(ProjectLogoUpload, {
      dictionary: { projectManagement: { logoDimensionHint: 'Khuyến nghị 512 × 512 px (tối thiểu 256 × 256 px).' }, common: {} } as any,
      imageUrl: null, hasSelectedFile: false, error: null, onSelect: () => undefined, onRemove: () => undefined
    }))

    expect(html).toContain('Khuyến nghị 512 × 512 px (tối thiểu 256 × 256 px).')
  })
})
