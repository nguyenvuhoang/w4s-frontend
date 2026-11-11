import { DATA_SOURCE_KEYS, DEFAULT_BINDING_KEYS } from '../formSchema.types'
import type { DataSourceKey, DefaultBindingKey } from '../formSchema.types'

export type BindingOption = {
  value: DefaultBindingKey
  labelVi: string
  labelEn: string
}

export const DEFAULT_BINDING_OPTIONS: BindingOption[] = [
  { value: 'current_user.full_name', labelVi: 'Họ tên người dùng hiện tại', labelEn: 'Current user full name' },
  { value: 'current_user.phone', labelVi: 'Số điện thoại người dùng hiện tại', labelEn: 'Current user phone' },
  { value: 'current_user.identity_number', labelVi: 'CCCD/CMND người dùng hiện tại', labelEn: 'Current user identity number' },
  { value: 'current_resident.id', labelVi: 'Mã cư dân hiện tại', labelEn: 'Current resident ID' },
  { value: 'current_apartment.id', labelVi: 'Mã căn hộ hiện tại', labelEn: 'Current apartment ID' },
  { value: 'current_apartment.code', labelVi: 'Số căn hộ hiện tại', labelEn: 'Current apartment code' },
  { value: 'current_project.id', labelVi: 'Mã dự án hiện tại', labelEn: 'Current project ID' },
  { value: 'current_project.name', labelVi: 'Tên dự án hiện tại', labelEn: 'Current project name' },
  { value: 'current_datetime', labelVi: 'Ngày giờ hiện tại', labelEn: 'Current date time' }
]

export type DataSourceOption = {
  value: DataSourceKey
  labelVi: string
  labelEn: string
}

export const DATA_SOURCE_OPTIONS: DataSourceOption[] = [
  { value: 'project_buildings', labelVi: 'Danh sách toà nhà theo dự án', labelEn: 'Project buildings' },
  { value: 'project_floors', labelVi: 'Danh sách tầng theo dự án', labelEn: 'Project floors' },
  { value: 'project_apartments', labelVi: 'Danh sách căn hộ theo dự án', labelEn: 'Project apartments' },
  { value: 'resident_lookup', labelVi: 'Tra cứu cư dân', labelEn: 'Resident lookup' },
  { value: 'apartment_lookup', labelVi: 'Tra cứu căn hộ', labelEn: 'Apartment lookup' }
]

export const isValidDefaultBinding = (value: unknown): value is DefaultBindingKey => (
  typeof value === 'string' && (DEFAULT_BINDING_KEYS as string[]).includes(value)
)

export const isValidDataSourceKey = (value: unknown): value is DataSourceKey => (
  typeof value === 'string' && (DATA_SOURCE_KEYS as string[]).includes(value)
)
