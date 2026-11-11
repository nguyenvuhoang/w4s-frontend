import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type {
  ApartmentFilterModel,
  ApartmentModel,
  ApartmentPayload,
  BuildingFilterModel,
  BuildingModel,
  BuildingPayload,
  FloorFilterModel,
  FloorPlanApartmentItem,
  FloorPlanLayoutItem,
  FloorPlanSummary,
  FloorModel,
  FloorPayload,
  ProjectContactFilterModel,
  ProjectContactItemModel,
  ProjectContactModel,
  ProjectContactPayload,
  ProjectBuildingModel,
  ProjectBuildingsByProjectResponseModel,
  ProjectCreatePayload,
  ProjectDetailModel,
  ProjectFilterModel,
  ProjectModel,
  ProjectUpdatePayload,
  ProjectPaymentConfigFilterModel,
  ProjectPaymentConfigModel,
  ProjectPaymentConfigPayload,
  ProjectPayload,
  ProjectSearchRequest,
  ProjectSearchResponse,
  ProjectSitePlanItem,
  ProjectSitePlanModel,
  PropertyStatus,
  ApartmentDetailModel,
  StackingPlanFilterModel,
  StackingPlanModel
} from './types'
import {
  mapProjectBankAccount,
  toProjectBankAccountPayload,
  type ProjectBankAccountUpdatePayload
} from './project/bank/projectBankTypes'

/** Explicit WF_BO_UPDATE_PROJECT bank object (no extra keys; an optional field not returned by GET stays omitted). */
const toProjectBankAccountUpdateInput = (account: ProjectBankAccountUpdatePayload) => ({
  // Existing account: its own id. A new account carries no id key (never the Project ID / a guessed id).
  ...(account.id !== undefined ? { id: account.id } : {}),
  bank_name: account.bank_name,
  account_number: account.account_number,
  account_holder: account.account_holder,
  ...(account.branch !== undefined ? { branch: account.branch } : {}),
  ...(account.qr_code_url !== undefined ? { qr_code_url: account.qr_code_url } : {}),
  transfer_content: account.transfer_content
})
import {
  mapProjectPaymentConfig,
  mapProjectPaymentConfigList,
  type ProjectPaymentConfig,
  type ProjectPaymentConfigCreatePayload,
  type ProjectPaymentConfigUpdatePayload
} from './project/payment/projectPaymentConfig'

const pause = () => new Promise(resolve => setTimeout(resolve, 220))

const now = () =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())

const projects_seed: ProjectModel[] = [
  {
    id: 1,
    project_code: 'PRJ_IPS_CENTRAL',
    name: 'IPS Central',
    project_name: 'IPS Central',
    image_url: '',
    logo_url: null,
    investor: 'IPS',
    management_company: 'VKNIGHT',
    address: '123 Nguyen Van Linh, Quan 7',
    province: 'TP.HCM',
    total_buildings: 3,
    total_floors: 72,
    total_units: 1248,
    active_residents: 2860,
    payment_config_status: 'active',
    qr_payment_enabled: true,
    voucher_enabled: true,
    status: 'active',
    last_modified: '13/06/2026 10:30'
  },
  {
    id: 2,
    project_code: 'PRJ_IPS_RIVERSIDE',
    name: 'IPS Riverside',
    project_name: 'IPS Riverside',
    image_url: '',
    logo_url: null,
    investor: 'IPS',
    management_company: 'VKNIGHT',
    address: '88 Mai Chi Tho, TP. Thu Duc',
    province: 'TP.HCM',
    total_buildings: 2,
    total_floors: 48,
    total_units: 860,
    active_residents: 1940,
    payment_config_status: 'active',
    qr_payment_enabled: true,
    voucher_enabled: true,
    status: 'active',
    last_modified: '12/06/2026 15:45'
  },
  {
    id: 3,
    project_code: 'PRJ_IPS_GARDEN',
    name: 'IPS Garden',
    project_name: 'IPS Garden',
    image_url: '',
    logo_url: null,
    investor: 'IPS',
    management_company: 'VKNIGHT',
    address: '25 Pham Van Dong',
    province: 'Ha Noi',
    total_buildings: 1,
    total_floors: 32,
    total_units: 420,
    active_residents: 780,
    payment_config_status: 'pending',
    qr_payment_enabled: false,
    voucher_enabled: false,
    status: 'draft',
    last_modified: '10/06/2026 09:20'
  }
]

const buildings_seed: BuildingModel[] = [
  {
    id: 1,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    total_floors: 32,
    total_units: 420,
    active_residents: 980,
    display_order: 1,
    status: 'active',
    last_modified: '13/06/2026 10:30'
  },
  {
    id: 2,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_B',
    building_name: 'Tower B',
    total_floors: 28,
    total_units: 360,
    active_residents: 820,
    display_order: 2,
    status: 'active',
    last_modified: '12/06/2026 16:20'
  },
  {
    id: 3,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_C',
    building_name: 'Tower C',
    total_floors: 20,
    total_units: 200,
    active_residents: 430,
    display_order: 3,
    status: 'active',
    last_modified: '13/06/2026 10:40'
  },
  {
    id: 4,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_D',
    building_name: 'Tower D',
    total_floors: 18,
    total_units: 180,
    active_residents: 390,
    display_order: 4,
    status: 'active',
    last_modified: '13/06/2026 10:45'
  },
  {
    id: 5,
    project_code: 'PRJ_IPS_RIVERSIDE',
    project_name: 'IPS Riverside',
    building_code: 'BLOCK_C',
    building_name: 'Block C',
    total_floors: 24,
    total_units: 280,
    active_residents: 610,
    display_order: 1,
    status: 'active',
    last_modified: '11/06/2026 09:15'
  }
]

const floors_seed: FloorModel[] = [
  {
    id: 1,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_01',
    floor_no: 1,
    floor_name: 'Floor 01',
    display_order: 1,
    total_units: 12,
    active_units: 12,
    status: 'active',
    last_modified: '13/06/2026 10:30'
  },
  {
    id: 2,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_02',
    floor_no: 2,
    floor_name: 'Floor 02',
    display_order: 2,
    total_units: 12,
    active_units: 10,
    status: 'active',
    last_modified: '13/06/2026 10:35'
  },
  {
    id: 3,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_B',
    building_name: 'Tower B',
    floor_code: 'B_01',
    floor_no: 1,
    floor_name: 'Floor 01',
    display_order: 1,
    total_units: 10,
    active_units: 10,
    status: 'active',
    last_modified: '12/06/2026 15:00'
  },
  {
    id: 4,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_11',
    floor_no: 11,
    floor_name: 'Floor 11',
    display_order: 11,
    total_units: 10,
    active_units: 8,
    status: 'active',
    last_modified: '13/06/2026 10:40'
  },
  {
    id: 5,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    floor_name: 'Floor 12',
    display_order: 12,
    total_units: 12,
    active_units: 10,
    status: 'active',
    last_modified: '13/06/2026 11:00'
  },
  {
    id: 6,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_B',
    building_name: 'Tower B',
    floor_code: 'B_05',
    floor_no: 5,
    floor_name: 'Floor 05',
    display_order: 5,
    total_units: 10,
    active_units: 7,
    status: 'active',
    last_modified: '12/06/2026 15:45'
  },
  {
    id: 7,
    project_code: 'PRJ_IPS_RIVERSIDE',
    project_name: 'IPS Riverside',
    building_code: 'BLOCK_C',
    building_name: 'Block C',
    floor_code: 'C_12',
    floor_no: 12,
    floor_name: 'Floor 12',
    display_order: 12,
    total_units: 8,
    active_units: 6,
    status: 'active',
    last_modified: '11/06/2026 10:15'
  }
]

const apartments_seed: ApartmentModel[] = [
  {
    id: 1,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1201',
    apartment_no: '1201',
    area: 78.5,
    owner_name: 'Nguyen Van A',
    water_meter_code: 'WM_A1201',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'occupied',
    last_modified: '13/06/2026 10:30'
  },
  {
    id: 2,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1202',
    apartment_no: '1202',
    area: 82,
    owner_name: 'Tran Thi B',
    water_meter_code: 'WM_A1202',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'occupied',
    last_modified: '13/06/2026 11:00'
  },
  {
    id: 3,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1203',
    apartment_no: '1203',
    area: 70,
    owner_name: '',
    water_meter_code: 'WM_A1203',
    electricity_meter_code: '',
    qr_payment_enabled: false,
    status: 'vacant',
    last_modified: '13/06/2026 11:15'
  },
  {
    id: 4,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_11',
    floor_no: 11,
    apartment_code: 'A1101',
    apartment_no: '1101',
    area: 78.5,
    owner_name: 'Le Van C',
    water_meter_code: 'WM_A1101',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'handed_over',
    last_modified: '12/06/2026 13:20'
  },
  {
    id: 5,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_11',
    floor_no: 11,
    apartment_code: 'A1102',
    apartment_no: '1102',
    area: 82,
    owner_name: '',
    water_meter_code: 'WM_A1102',
    electricity_meter_code: '',
    qr_payment_enabled: false,
    status: 'locked',
    last_modified: '12/06/2026 14:00'
  },
  {
    id: 6,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_B',
    building_name: 'Tower B',
    floor_code: 'B_05',
    floor_no: 5,
    apartment_code: 'B0508',
    apartment_no: '0508',
    area: 65.2,
    owner_name: '',
    water_meter_code: 'WM_B0508',
    electricity_meter_code: '',
    qr_payment_enabled: false,
    status: 'vacant',
    last_modified: '12/06/2026 15:45'
  },
  {
    id: 7,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1204',
    apartment_no: '1204',
    area: 68.4,
    owner_name: 'Pham Minh Khoa',
    water_meter_code: 'WM_A1204',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'handed_over',
    last_modified: '13/06/2026 11:30'
  },
  {
    id: 8,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1205',
    apartment_no: '1205',
    area: 76,
    owner_name: '',
    water_meter_code: 'WM_A1205',
    electricity_meter_code: '',
    qr_payment_enabled: false,
    status: 'locked',
    last_modified: '13/06/2026 11:45'
  },
  {
    id: 9,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1206',
    apartment_no: '1206',
    area: 84.2,
    owner_name: 'Doan Thi Linh',
    water_meter_code: 'WM_A1206',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'occupied',
    last_modified: '13/06/2026 12:05'
  },
  {
    id: 10,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1207',
    apartment_no: '1207',
    area: 66.8,
    owner_name: '',
    water_meter_code: 'WM_A1207',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'vacant',
    last_modified: '13/06/2026 12:20'
  },
  {
    id: 11,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_12',
    floor_no: 12,
    apartment_code: 'A1208',
    apartment_no: '1208',
    area: 91.5,
    owner_name: 'Hoang Quoc Viet',
    water_meter_code: 'WM_A1208',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'occupied',
    last_modified: '13/06/2026 12:35'
  },
  {
    id: 12,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    building_code: 'TOWER_A',
    building_name: 'Tower A',
    floor_code: 'A_11',
    floor_no: 11,
    apartment_code: 'A1103',
    apartment_no: '1103',
    area: 70,
    owner_name: 'Mai Thanh Ha',
    water_meter_code: 'WM_A1103',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'occupied',
    last_modified: '12/06/2026 14:15'
  },
  {
    id: 13,
    project_code: 'PRJ_IPS_RIVERSIDE',
    project_name: 'IPS Riverside',
    building_code: 'BLOCK_C',
    building_name: 'Block C',
    floor_code: 'C_12',
    floor_no: 12,
    apartment_code: 'C1201',
    apartment_no: '1201',
    area: 74.5,
    owner_name: 'Nguyen Minh Anh',
    water_meter_code: 'WM_C1201',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'occupied',
    last_modified: '11/06/2026 10:30'
  },
  {
    id: 14,
    project_code: 'PRJ_IPS_RIVERSIDE',
    project_name: 'IPS Riverside',
    building_code: 'BLOCK_C',
    building_name: 'Block C',
    floor_code: 'C_12',
    floor_no: 12,
    apartment_code: 'C1202',
    apartment_no: '1202',
    area: 68,
    owner_name: '',
    water_meter_code: 'WM_C1202',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'vacant',
    last_modified: '11/06/2026 10:45'
  },
  {
    id: 15,
    project_code: 'PRJ_IPS_RIVERSIDE',
    project_name: 'IPS Riverside',
    building_code: 'BLOCK_C',
    building_name: 'Block C',
    floor_code: 'C_12',
    floor_no: 12,
    apartment_code: 'C1203',
    apartment_no: '1203',
    area: 82.3,
    owner_name: 'Tran Quoc Huy',
    water_meter_code: 'WM_C1203',
    electricity_meter_code: '',
    qr_payment_enabled: true,
    status: 'occupied',
    last_modified: '11/06/2026 11:00'
  }
]

const project_contacts_seed: ProjectContactModel[] = [
  {
    id: 1,
    project_code: 'PRJ_IPS_CENTRAL',
    contact_type: 'management_board',
    contact_name: 'Ban quan ly IPS Central',
    phone_number: '1900 1001',
    email: 'bql.central@ips.vn',
    position: 'BQL',
    working_time: '08:00 - 18:00',
    is_emergency: false,
    status: 'active'
  },
  {
    id: 2,
    project_code: 'PRJ_IPS_CENTRAL',
    contact_type: 'security',
    contact_name: 'Bao ve Tower A',
    phone_number: '0901000001',
    email: '',
    position: 'Security',
    working_time: '24/7',
    is_emergency: true,
    status: 'active'
  },
  {
    id: 3,
    project_code: 'PRJ_IPS_CENTRAL',
    contact_type: 'technical',
    contact_name: 'Ky thuat dien nuoc',
    phone_number: '0901000002',
    email: 'technical.central@ips.vn',
    position: 'Technical Support',
    working_time: '08:00 - 22:00',
    is_emergency: true,
    status: 'active'
  },
  {
    id: 4,
    project_code: 'PRJ_IPS_RIVERSIDE',
    contact_type: 'management_board',
    contact_name: 'Ban quan ly IPS Riverside',
    phone_number: '1900 1002',
    email: 'bql.riverside@ips.vn',
    position: 'BQL',
    working_time: '08:00 - 18:00',
    is_emergency: false,
    status: 'active'
  },
  {
    id: 5,
    project_code: 'PRJ_IPS_RIVERSIDE',
    contact_type: 'security',
    contact_name: 'Bao ve Block C',
    phone_number: '0902000001',
    email: '',
    position: 'Security',
    working_time: '24/7',
    is_emergency: true,
    status: 'active'
  }
]

const payment_configs_seed: ProjectPaymentConfigModel[] = [
  {
    id: 1,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    fee_type_code: 'PQL',
    fee_type_name: 'Phi quan ly can ho',
    payment_channels: ['mobile_app', 'qr', 'bank_transfer'],
    payment_provider: 'vietqr',
    bank_account_no: '123456789',
    bank_name: 'Vietcombank',
    qr_dynamic_enabled: true,
    auto_reconcile_enabled: true,
    status: 'active',
    last_modified: '13/06/2026 10:30'
  },
  {
    id: 2,
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    fee_type_code: 'VCR',
    fee_type_name: 'Phi van chuyen rac',
    payment_channels: ['mobile_app', 'qr'],
    payment_provider: 'vietqr',
    bank_account_no: '123456789',
    bank_name: 'Vietcombank',
    qr_dynamic_enabled: true,
    auto_reconcile_enabled: false,
    status: 'active',
    last_modified: '12/06/2026 14:00'
  },
  {
    id: 3,
    project_code: 'PRJ_IPS_RIVERSIDE',
    project_name: 'IPS Riverside',
    fee_type_code: 'PQL',
    fee_type_name: 'Phi quan ly can ho',
    payment_channels: ['mobile_app', 'qr'],
    payment_provider: 'vietqr',
    bank_account_no: '987654321',
    bank_name: 'BIDV',
    qr_dynamic_enabled: true,
    auto_reconcile_enabled: true,
    status: 'active',
    last_modified: '11/06/2026 10:20'
  },
  {
    id: 4,
    project_code: 'PRJ_IPS_GARDEN',
    project_name: 'IPS Garden',
    fee_type_code: 'OMT',
    fee_type_name: 'Phi quan ly o dau xe oto',
    payment_channels: ['bank_transfer'],
    payment_provider: 'manual',
    bank_account_no: '',
    bank_name: '',
    qr_dynamic_enabled: false,
    auto_reconcile_enabled: false,
    status: 'pending',
    last_modified: '10/06/2026 09:20'
  }
]

const project_site_plan_seed: ProjectSitePlanModel[] = [
  {
    project_code: 'PRJ_IPS_CENTRAL',
    project_name: 'IPS Central',
    layout_type: 'cluster_rectangle',
    site_plan: {
      view_mode: 'isometric',
      canvas_width: 1200,
      canvas_height: 700,
      items: [
        {
          building_code: 'TOWER_A',
          building_name: 'Tower A',
          shape_type: 'rectangle',
          position_x: 160,
          position_y: 170,
          width: 150,
          depth: 92,
          height_level: 32,
          rotation: 0,
          display_order: 1,
          total_floors: 32,
          total_units: 420,
          active_residents: 980,
          status: 'active',
          last_modified: '13/06/2026 10:30'
        },
        {
          building_code: 'TOWER_B',
          building_name: 'Tower B',
          shape_type: 'rectangle',
          position_x: 410,
          position_y: 150,
          width: 145,
          depth: 88,
          height_level: 28,
          rotation: 0,
          display_order: 2,
          total_floors: 28,
          total_units: 360,
          active_residents: 820,
          status: 'active',
          last_modified: '12/06/2026 16:20'
        },
        {
          building_code: 'TOWER_C',
          building_name: 'Tower C',
          shape_type: 'rectangle',
          position_x: 210,
          position_y: 390,
          width: 138,
          depth: 84,
          height_level: 20,
          rotation: 0,
          display_order: 3,
          total_floors: 20,
          total_units: 200,
          active_residents: 430,
          status: 'active',
          last_modified: '13/06/2026 10:40'
        },
        {
          building_code: 'TOWER_D',
          building_name: 'Tower D',
          shape_type: 'rectangle',
          position_x: 470,
          position_y: 380,
          width: 132,
          depth: 82,
          height_level: 18,
          rotation: 0,
          display_order: 4,
          total_floors: 18,
          total_units: 180,
          active_residents: 390,
          status: 'active',
          last_modified: '13/06/2026 10:45'
        }
      ]
    }
  },
  {
    project_code: 'PRJ_IPS_RIVERSIDE',
    project_name: 'IPS Riverside',
    layout_type: 'parallel_row',
    site_plan: {
      view_mode: 'isometric',
      canvas_width: 1200,
      canvas_height: 700,
      items: [
        {
          building_code: 'BLOCK_C',
          building_name: 'Block C',
          shape_type: 'rectangle',
          position_x: 230,
          position_y: 240,
          width: 170,
          depth: 96,
          height_level: 24,
          rotation: 0,
          display_order: 1,
          total_floors: 24,
          total_units: 280,
          active_residents: 610,
          status: 'active',
          last_modified: '11/06/2026 09:15'
        }
      ]
    }
  },
  {
    project_code: 'PRJ_IPS_GARDEN',
    project_name: 'IPS Garden',
    layout_type: 'custom',
    site_plan: {
      view_mode: 'isometric',
      canvas_width: 1200,
      canvas_height: 700,
      items: []
    }
  }
]

let projects = [...projects_seed]
let buildings = [...buildings_seed]
let floors = [...floors_seed]
let apartments = [...apartments_seed]
let project_contacts = [...project_contacts_seed]
let payment_configs = [...payment_configs_seed]
let project_site_plans = [...project_site_plan_seed]

const includes_keyword = (values: string[], keyword: string) => {
  const next_keyword = keyword.trim().toLowerCase()

  return !next_keyword || values.some(value => value.toLowerCase().includes(next_keyword))
}

const PROJECTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'
const PROJECT_DETAIL_WORKFLOW_ID = 'WF_BO_GET_PROJECT_DETAIL'
/** Logo upload (MinIO presign + PUT) failure, kept distinct from workflow errors so forms can label it. */
export type ProjectLogoUploadFailureReason =
  /** /api/projects/logo/presign-upload refused or failed (message = its message). */
  | 'presign'
  /** The browser could not complete the PUT to storage (offline, DNS, TLS, blocked cross-origin request...). */
  | 'network'
  /** Storage answered the PUT with a non-2xx status (see `status`). */
  | 'storage'

export class ProjectLogoUploadError extends Error {
  readonly reason: ProjectLogoUploadFailureReason
  readonly status?: number

  constructor(message: string, reason: ProjectLogoUploadFailureReason = 'presign', status?: number) {
    super(message)
    this.name = 'ProjectLogoUploadError'
    this.reason = reason
    this.status = status
  }
}

const PROJECT_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_PROJECT'
const PROJECT_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_PROJECT'
export const PROJECT_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_PROJECT'
const PROJECT_BUILDINGS_WORKFLOW_ID = 'WF_BO_GET_BUILDING_BY_PROJECT_ID'
const PROJECT_CONTACTS_WORKFLOW_ID = 'WF_BO_LIST_PROJECT_CONTACTS'
const PROJECT_PAYMENT_CONFIG_GET_WORKFLOW_ID = 'WF_BO_GET_PROJECT_PAYMENT_CONFIG_BY_ID'
const PROJECT_PAYMENT_CONFIG_LIST_WORKFLOW_ID = 'WF_BO_LIST_PROJECT_PAYMENT_CONFIGS'
const PROJECT_PAYMENT_CONFIG_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_PROJECT_PAYMENT_CONFIG'

/**
 * Failure of WF_BO_CREATE_PROJECT_PAYMENT_CONFIG. `message` is the backend message + error reference;
 * `duplicateCode` = Backend rejected the config_code as already existing; `executionId` for the reference.
 */
export class ProjectPaymentConfigCreateError extends Error {
  constructor(message: string, readonly duplicateCode: boolean, readonly executionId: string) {
    super(message)
    this.name = 'ProjectPaymentConfigCreateError'
  }
}

const isDuplicateWorkflowError = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const texts = [
    ...(Array.isArray(errors) ? errors.flatMap((error: any) => [error?.code, error?.info, error?.message, error?.description]) : []),
    dataresponse?.message,
    response?.message
  ].filter((value): value is string => typeof value === 'string')

  return texts.some(value => /duplicat|already exist|exists|unique|đã tồn tại|trùng/i.test(value))
}
const PROJECT_PAYMENT_CONFIG_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_PROJECT_PAYMENT_CONFIG'

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
    acc[normalizeKey(key)] = item[key]

    return acc
  }, {})

  for (const key of keys) {
    const value = normalizedMap[normalizeKey(key)]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

export const pickDataRoot = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data ?? response

  return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.input?.items)) return root.input.items

  return []
}

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : undefined
}

const toBoolean = (value: unknown) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const normalizeProjectStatus = (status: unknown): PropertyStatus => {
  const value = String(status ?? '').trim().toUpperCase()

  if (value === 'A' || value === 'ACTIVE') return 'active'
  if (value === 'I' || value === 'INACTIVE') return 'inactive'
  if (value === 'DRAFT') return 'draft'

  return 'inactive'
}

const toBackendProjectStatus = (status: PropertyStatus): 'A' | 'I' => (status === 'active' ? 'A' : 'I')

const normalizeResponsePage = (value: unknown, request_page_index: number) => {
  const response_page = toNumber(value, request_page_index)

  return Math.max(response_page, 0)
}

const getWorkflowExecutionId = (response: any, error?: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data

  return error?.execution_id
    ?? error?.execute_id
    ?? error?.executionId
    ?? dataresponse?.execution_id
    ?? dataresponse?.execute_id
    ?? dataresponse?.executionId
    ?? data?.execution_id
    ?? data?.execute_id
    ?? response?.payload?.execution_id
    ?? response?.execution_id
    ?? ''
}

const getWorkflowErrorMessage = (response: any, fallback: string, language?: Locale) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const first_error = Array.isArray(errors) && errors.length > 0 ? errors[0] : undefined
  const message = first_error?.info
    ?? first_error?.message
    ?? first_error?.description
    ?? dataresponse?.message
    ?? dataresponse?.data?.message
    ?? response?.payload?.message
    ?? response?.message
    ?? fallback
  const execution_id = getWorkflowExecutionId(response, first_error)

  if (!execution_id) return message

  const reference_label = language === 'vi' ? 'M\u00e3 tra c\u1ee9u l\u1ed7i' : 'Error Reference'

  return `${message} ${reference_label}: ${execution_id}`
}

export const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw new Error(getWorkflowErrorMessage(response, fallback, language))
  }
}

export type AuthorizedProjectOption = {
  id: number
  code: string
  name: string
}

const mapAuthorizedProjectToModel = (project: AuthorizedProjectOption): ProjectModel => ({
  id: project.id,
  project_code: project.code,
  name: project.name,
  project_name: project.name,
  image_url: '',
  logo_url: null,
  investor: '',
  management_company: '',
  address: '',
  province: '',
  // The BO context carries no aggregate counts: unknown, not 0.
  total_buildings: null,
  total_floors: null,
  total_units: null,
  active_residents: null,
  payment_config_status: null,
  qr_payment_enabled: null,
  voucher_enabled: null,
  status: 'active',
  last_modified: null,
  description: null
})

/**
 * Non-super-admin users must only ever see/search the projects listed in their BO Context
 * (WF_BO_GET_BO_CONTEXT). That workflow doesn't expose a project-scope filter, so instead of
 * calling the unrestricted search workflow and filtering its already-paginated page (which would
 * corrupt total_count/total_pages), we search and paginate directly over the authorized list.
 */
const buildAuthorizedProjectSearchResponse = (
  authorizedProjects: AuthorizedProjectOption[],
  filter: ProjectFilterModel
): ProjectSearchResponse => {
  const matched = authorizedProjects.filter(project => includes_keyword([project.name, project.code], filter.search_text))

  const total_count = matched.length
  const page_size = filter.page_size > 0 ? filter.page_size : total_count || 1
  const total_pages = Math.ceil(total_count / page_size)
  const page_index = total_pages > 0 ? Math.min(Math.max(filter.page_index, 0), total_pages - 1) : 0
  const start = page_index * page_size

  return {
    items: matched.slice(start, start + page_size).map(mapAuthorizedProjectToModel),
    total_count,
    total_pages,
    has_previous_page: page_index > 0,
    has_next_page: page_index < total_pages - 1,
    page_index,
    page_size
  }
}

const mapProjectSearchItem = (item: any): ProjectModel => {
  const project_code = String(getField(item, ['project_code', 'projectCode', 'code']) ?? '').trim()
  const id = toNumber(getField(item, ['id', 'project_id', 'projectId']))
  const name = String(getField(item, ['name', 'project_name', 'projectName']) ?? (project_code || id)).trim()
  const logo_url = getField(item, ['logo_url', 'logoUrl', 'image_url', 'imageUrl']) ?? null

  return {
    id,
    project_code,
    name,
    project_name: name,
    image_url: logo_url ? String(logo_url) : '',
    logo_url: logo_url ? String(logo_url) : null,
    investor: '',
    management_company: '',
    address: String(getField(item, ['address']) ?? ''),
    province: String(getField(item, ['province']) ?? ''),
    // Aggregate counts: read with the field names of the Project Detail contract; a missing field stays
    // null ("unknown", shown as "--") instead of a fake 0. An explicit 0 from the Backend is kept.
    total_buildings: toOptionalNumber(getField(item, ['total_buildings'])) ?? null,
    total_floors: toOptionalNumber(getField(item, ['total_floors'])) ?? null,
    total_units: toOptionalNumber(getField(item, ['total_apartments'])) ?? null,
    // No confirmed "active residents" field (total_residents is a different figure): unknown.
    active_residents: null,
    // Not in the confirmed search contract yet: unknown ("--"), never a made-up pending / off / empty value.
    payment_config_status: null,
    qr_payment_enabled: null,
    voucher_enabled: null,
    status: normalizeProjectStatus(getField(item, ['status'])),
    last_modified: null,
    description: getField(item, ['description']) ?? null
  }
}

/**
 * Explicit WF_BO_SIMPLE_SEARCH_PROJECTS input (no spread, so nothing outside the contract leaks in).
 * `province` is a planned Backend field: it is always sent, even empty, and is never filtered on the
 * client. If the deployed workflow still rejects unknown fields, search fails until the Backend
 * migration ships — intentionally there is no fallback that drops it.
 * `project_name` has no dedicated filter on screen yet, so it stays empty (search_text is not copied).
 */
export const buildProjectSearchRequest = (filter: ProjectFilterModel): ProjectSearchRequest => ({
  page_size: filter.page_size,
  page_index: Math.max(filter.page_index, 0),
  status: filter.status,
  search_text: filter.search_text.trim(),
  project_name: '',
  province: filter.province
})

const mapProjectsSearchResponse = (response: any, request: ProjectSearchRequest): ProjectSearchResponse => {
  const root = pickDataRoot(response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = request.page_size
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapProjectSearchItem),
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage'])),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size
  }
}

const mapProjectDetail = (item: any): ProjectDetailModel | null => {
  const id = toNumber(getField(item, ['id', 'project_id', 'projectId']), NaN)
  const project_code = String(getField(item, ['project_code', 'projectCode']) ?? '').trim()

  if (!Number.isFinite(id) && !project_code) return null

  return {
    id: Number.isFinite(id) ? id : 0,
    project_code,
    name: String(getField(item, ['name', 'project_name', 'projectName']) ?? '').trim(),
    address: getField(item, ['address']) ?? null,
    description: getField(item, ['description']) ?? null,
    logo_url: getField(item, ['logo_url', 'logoUrl']) ?? null,
    status: normalizeProjectStatus(getField(item, ['status'])),
    investor: getField(item, ['investor']) ?? null,
    province: getField(item, ['province']) ?? null,
    handover_date: getField(item, ['handover_date', 'handoverDate']) ?? null
  }
}

const mapProjectBuildingItem = (item: any): ProjectBuildingModel => {
  const raw_display_order = getField(item, ['display_order', 'displayOrder'])
  const parsed_display_order = Number(raw_display_order)

  return {
    id: toOptionalNumber(getField(item, ['id'])),
    building_id: toNumber(getField(item, ['building_id', 'buildingId', 'id'])),
    building_code: String(getField(item, ['building_code', 'buildingCode']) ?? '').trim(),
    project_id: toNumber(getField(item, ['project_id', 'projectId'])),
    name: String(getField(item, ['name', 'building_name']) ?? '').trim(),
    floor_count: toNumber(getField(item, ['floor_count', 'floorCount']), 0),
    // Per-building counts as returned; a missing field stays null ("--"), an explicit 0 is kept.
    total_apartments: toOptionalNumber(getField(item, ['total_apartments'])) ?? null,
    active_residents: toOptionalNumber(getField(item, ['active_residents'])) ?? null,
    display_order: Number.isFinite(parsed_display_order) ? parsed_display_order : null,
    status: normalizeProjectStatus(getField(item, ['status']))
  }
}

const mapProjectContactItem = (item: any): ProjectContactItemModel => {
  const raw_display_order = getField(item, ['display_order', 'displayOrder'])
  const parsed_display_order = Number(raw_display_order)

  return {
    project_id: toNumber(getField(item, ['project_id', 'projectId'])),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? '').trim(),
    contact_type: String(getField(item, ['contact_type', 'contactType']) ?? '').trim(),
    name: String(getField(item, ['name', 'contact_name']) ?? '').trim(),
    phone: getField(item, ['phone', 'phone_number']) ?? null,
    email: getField(item, ['email']) ?? null,
    address: getField(item, ['address']) ?? null,
    working_hours: getField(item, ['working_hours', 'workingHours']) ?? null,
    note: getField(item, ['note']) ?? null,
    display_order: Number.isFinite(parsed_display_order) ? parsed_display_order : null
  }
}

const next_id = (items: { id: number }[]) => Math.max(0, ...items.map(item => item.id)) + 1
const find_project_name = (project_code: string) => projects.find(project => project.project_code === project_code)?.project_name ?? project_code
const find_building_name = (building_code: string) => buildings.find(building => building.building_code === building_code)?.building_name ?? building_code
const find_floor_no = (floor_code: string) => floors.find(floor => floor.floor_code === floor_code)?.floor_no ?? 0

const debt_by_apartment_code: Record<string, number> = {
  A1201: 0,
  A1202: 680000,
  A1203: 0,
  A1204: 1250000,
  A1205: 2400000,
  A1206: 0,
  A1207: 0,
  A1208: 390000,
  A1101: 0,
  A1102: 1750000,
  A1103: 0,
  B0508: 0
}

const latest_fee_status_by_apartment_code: Record<string, ApartmentDetailModel['latest_fee_status']> = {
  A1201: 'paid',
  A1202: 'unpaid',
  A1203: 'paid',
  A1204: 'unpaid',
  A1205: 'overdue',
  A1206: 'paid',
  A1207: 'paid',
  A1208: 'unpaid',
  A1101: 'paid',
  A1102: 'overdue',
  A1103: 'paid',
  B0508: 'paid'
}

const build_floor_summary = (floor_apartments: ApartmentModel[]): FloorPlanSummary => ({
  total_units: floor_apartments.length,
  occupied_units: floor_apartments.filter(apartment => apartment.status === 'occupied').length,
  vacant_units: floor_apartments.filter(apartment => apartment.status === 'vacant').length,
  handed_over_units: floor_apartments.filter(apartment => apartment.status === 'handed_over').length,
  locked_units: floor_apartments.filter(apartment => apartment.status === 'locked').length,
  qr_enabled_units: floor_apartments.filter(apartment => apartment.qr_payment_enabled).length
})

const to_floor_plan_apartment = (apartment: ApartmentModel, index: number, split_index: number): FloorPlanApartmentItem => ({
  apartment_code: apartment.apartment_code,
  apartment_no: apartment.apartment_no,
  area: apartment.area,
  owner_name: apartment.owner_name,
  water_meter_code: apartment.water_meter_code,
  electricity_meter_code: apartment.electricity_meter_code,
  qr_payment_enabled: apartment.qr_payment_enabled,
  status: apartment.status,
  description: apartment.description,
  item_type: 'apartment',
  position: index < split_index ? 'top' : 'bottom',
  sort_order: index < split_index ? index + 1 : index - split_index + 1,
  current_debt: debt_by_apartment_code[apartment.apartment_code] ?? 0,
  latest_fee_status: latest_fee_status_by_apartment_code[apartment.apartment_code] ?? 'paid'
})

const build_floor_layout = (floor_apartments: ApartmentModel[]): FloorPlanLayoutItem[] => {
  const sorted_apartments = [...floor_apartments].sort((left, right) => left.apartment_no.localeCompare(right.apartment_no))
  const split_index = Math.ceil(sorted_apartments.length / 2)
  const apartment_items = sorted_apartments.map((apartment, index) => to_floor_plan_apartment(apartment, index, split_index))

  return [
    ...apartment_items.filter(item => item.position === 'top'),
    { item_type: 'stair', position: 'top', sort_order: 90, label: 'Stair' },
    { item_type: 'elevator', position: 'top', sort_order: 91, label: 'Elevator' },
    { item_type: 'corridor', position: 'middle', sort_order: 1, label: 'Corridor' },
    ...apartment_items.filter(item => item.position === 'bottom'),
    { item_type: 'technical', position: 'bottom', sort_order: 90, label: 'Technical' },
    { item_type: 'service', position: 'bottom', sort_order: 91, label: 'Service' }
  ]
}

const build_apartment_detail = (apartment: ApartmentModel): ApartmentDetailModel => ({
  ...apartment,
  current_debt: debt_by_apartment_code[apartment.apartment_code] ?? 0,
  latest_fee_status: latest_fee_status_by_apartment_code[apartment.apartment_code] ?? 'paid'
})

const recalculate_project_aggregate = () => {
  buildings = buildings.map(building => {
    const building_floors = floors.filter(floor => floor.building_code === building.building_code)
    const building_apartments = apartments.filter(apartment => apartment.building_code === building.building_code)

    return {
      ...building,
      total_floors: building_floors.length || building.total_floors,
      total_units: building_apartments.length || building.total_units,
      active_residents: building_apartments.filter(apartment => Boolean(apartment.owner_name)).length || building.active_residents
    }
  })

  floors = floors.map(floor => {
    const floor_apartments = apartments.filter(apartment => apartment.floor_code === floor.floor_code)

    return {
      ...floor,
      total_units: floor_apartments.length || floor.total_units,
      active_units: floor_apartments.filter(apartment => apartment.status !== 'vacant').length || floor.active_units
    }
  })

  projects = projects.map(project => {
    const project_buildings = buildings.filter(building => building.project_code === project.project_code)

    return {
      ...project,
      total_buildings: project_buildings.length,
      total_floors: project_buildings.reduce((sum, building) => sum + building.total_floors, 0),
      total_units: project_buildings.reduce((sum, building) => sum + building.total_units, 0),
      active_residents: project_buildings.reduce((sum, building) => sum + building.active_residents, 0)
    }
  })
}

export const propertyAggregateService = {
  get_project_options() {
    return projects.map(project => ({ project_code: project.project_code, project_name: project.project_name }))
  },

  get_building_options(project_code = '') {
    return buildings
      .filter(building => !project_code || building.project_code === project_code)
      .map(building => ({ project_code: building.project_code, building_code: building.building_code, building_name: building.building_name }))
  },

  get_floor_options(project_code = '', building_code = '') {
    return floors
      .filter(floor => (!project_code || floor.project_code === project_code) && (!building_code || floor.building_code === building_code))
      .map(floor => ({ building_code: floor.building_code, floor_code: floor.floor_code, floor_name: floor.floor_name }))
  },

  getDefaultProjectSearchResponse(filter?: Partial<ProjectFilterModel>): ProjectSearchResponse {
    return {
      items: [],
      total_count: 0,
      total_pages: 0,
      has_previous_page: false,
      has_next_page: false,
      page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
      page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
    }
  },

  async simpleSearchProjects({
    sessiontoken,
    language,
    filter,
    isSuperAdmin = true,
    authorizedProjects = []
  }: {
    sessiontoken?: string
    language?: Locale
    filter: ProjectFilterModel
    /** From BO Context (WF_BO_GET_BO_CONTEXT). Defaults to true so existing callers keep unrestricted search. */
    isSuperAdmin?: boolean
    /** Required when isSuperAdmin is false — the project list the current session is authorized to see. */
    authorizedProjects?: AuthorizedProjectOption[]
  }): Promise<ProjectSearchResponse> {
    if (!isSuperAdmin) return buildAuthorizedProjectSearchResponse(authorizedProjects, filter)

    if (!sessiontoken) return this.getDefaultProjectSearchResponse(filter)

    const request = buildProjectSearchRequest(filter)

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECTS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load projects.', language)

    return mapProjectsSearchResponse(response, request)
  },

  async get_project_detail({
    sessiontoken,
    language,
    project_id
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
  }): Promise<ProjectDetailModel | null> {
    if (!sessiontoken) return null

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_DETAIL_WORKFLOW_ID,
      input: { project_id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load project detail.', language)

    const root = pickDataRoot(response)
    const project_raw = getField(root, ['project'])
    const project = mapProjectDetail(project_raw)

    if (!project) return null

    // Aggregates live at the response root (next to `project`), never inside it; 0 is kept, missing = undefined.
    return {
      ...project,
      total_buildings: toOptionalNumber(getField(root, ['total_buildings'])),
      total_floors: toOptionalNumber(getField(root, ['total_floors'])),
      total_apartments: toOptionalNumber(getField(root, ['total_apartments'])),
      total_residents: toOptionalNumber(getField(root, ['total_residents'])),
      active_residents: toOptionalNumber(getField(root, ['active_residents'])),
      inactive_residents: toOptionalNumber(getField(root, ['inactive_residents'])),
      // Same objects as the WF_BO_CREATE_PROJECT contract; not confirmed in the Detail response yet (null = not returned).
      operating_bank_account: mapProjectBankAccount(getField(project_raw, ['operating_bank_account']) ?? getField(root, ['operating_bank_account'])),
      deposit_bank_account: mapProjectBankAccount(getField(project_raw, ['deposit_bank_account']) ?? getField(root, ['deposit_bank_account']))
    }
  },

  /**
   * Creates a project through WF_BO_CREATE_PROJECT. Only the fields of the Backend-confirmed contract
   * are sent. The response body is not part of that contract, so the created project is read
   * defensively (it may be null; callers fall back to the project list).
   */
  async create_project_detail({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: ProjectCreatePayload
  }): Promise<ProjectDetailModel | null> {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_CREATE_WORKFLOW_ID,
      input: {
        name: payload.name,
        province: payload.province,
        address: payload.address,
        investor: payload.investor,
        project_code: payload.project_code,
        logo_url: payload.logo_url,
        description: payload.description,
        handover_date: payload.handover_date,
        operating_bank_account: toProjectBankAccountPayload(payload.operating_bank_account),
        deposit_bank_account: toProjectBankAccountPayload(payload.deposit_bank_account)
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to create project.', language)

    const root = pickDataRoot(response)

    return mapProjectDetail(getField(root, ['project']) ?? root)
  },

  async update_project_detail({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: ProjectUpdatePayload
  }) {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_UPDATE_WORKFLOW_ID,
      input: {
        id: payload.id,
        project_code: payload.project_code,
        name: payload.name,
        address: payload.address,
        description: payload.description,
        logo_url: payload.logo_url,
        status: toBackendProjectStatus(payload.status),
        investor: payload.investor,
        province: payload.province,
        handover_date: payload.handover_date,
        // Bank accounts (not PaymentConfig): sent only for an account GET returned with its own id.
        ...(payload.operating_bank_account ? { operating_bank_account: toProjectBankAccountUpdateInput(payload.operating_bank_account) } : {}),
        ...(payload.deposit_bank_account ? { deposit_bank_account: toProjectBankAccountUpdateInput(payload.deposit_bank_account) } : {})
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to update project.', language)

    return response
  },

  /** WF_BO_DELETE_PROJECT { id }. Business rejections (e.g. project still referenced) throw with the backend message + execution reference. */
  async delete_project_detail({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }) {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_DELETE_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete project.', language)

    return response
  },

  /**
   * WF_BO_GET_PROJECT_PAYMENT_CONFIG_BY_ID (fields: { id }). Returns the mapped `data`, or null when the
   * workflow succeeds without a configuration. Failures throw with the execution reference.
   */
  async get_project_payment_config_by_id({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<ProjectPaymentConfig | null> {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_PAYMENT_CONFIG_GET_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load project payment configuration.', language)

    return mapProjectPaymentConfig(pickDataRoot(response))
  },

  /**
   * WF_BO_LIST_PROJECT_PAYMENT_CONFIGS (fields: { project_id }) -> mapped `data.payment_configs` (every row, the
   * ownership filter is applied by the caller). Empty list when the project has none. Failures throw with the
   * execution reference.
   */
  async list_project_payment_configs_workflow({
    sessiontoken,
    language,
    project_id
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
  }): Promise<ProjectPaymentConfig[]> {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_PAYMENT_CONFIG_LIST_WORKFLOW_ID,
      input: { project_id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load project payment configurations.', language)

    return mapProjectPaymentConfigList(pickDataRoot(response))
  },

  /** WF_BO_CREATE_PROJECT_PAYMENT_CONFIG with exactly the contract fields (Backend creates the record id). */
  async create_project_payment_config_workflow({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: ProjectPaymentConfigCreatePayload
  }) {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_PAYMENT_CONFIG_CREATE_WORKFLOW_ID,
      input: {
        qr_template: payload.qr_template,
        project_id: payload.project_id,
        config_code: payload.config_code,
        merchant_id: payload.merchant_id,
        is_default: payload.is_default,
        account_no: payload.account_no,
        account_name: payload.account_name,
        callback_url: payload.callback_url,
        terminal_id: payload.terminal_id,
        payment_purpose: payload.payment_purpose,
        provider: payload.provider,
        metadata_json: payload.metadata_json
      },
      language
    })

    try {
      assertWorkflowSuccess(response, 'Unable to create project payment configuration.', language)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create project payment configuration.'

      throw new ProjectPaymentConfigCreateError(message, isDuplicateWorkflowError(response), String(getWorkflowExecutionId(response) || ''))
    }

    return response
  },

  /** WF_BO_UPDATE_PROJECT_PAYMENT_CONFIG with exactly the contract fields (no project_id / config_code). */
  async update_project_payment_config_workflow({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: ProjectPaymentConfigUpdatePayload
  }) {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_PAYMENT_CONFIG_UPDATE_WORKFLOW_ID,
      input: {
        id: payload.id,
        qr_template: payload.qr_template,
        merchant_id: payload.merchant_id,
        is_default: payload.is_default,
        account_no: payload.account_no,
        status: payload.status,
        account_name: payload.account_name,
        callback_url: payload.callback_url,
        terminal_id: payload.terminal_id,
        payment_purpose: payload.payment_purpose,
        provider: payload.provider,
        metadata_json: payload.metadata_json
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to update project payment configuration.', language)

    return response
  },

  /**
   * Uploads a project logo to MinIO through /api/projects/logo/presign-upload and returns the real
   * public URL from its response. `projectId` is omitted when the project does not exist yet (Create).
   */
  async upload_project_logo({
    projectId,
    file
  }: {
    projectId?: number
    file: File
  }): Promise<string> {
    const content_type = file.type || 'image/png'

    const presignResponse = await fetch('/api/projects/logo/presign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(projectId ? { project_id: projectId } : {}),
        file_name: file.name,
        content_type,
        file_size: file.size
      })
    })

    const presignJson = await presignResponse.json().catch(() => ({}))

    if (!presignResponse.ok || !presignJson?.success) {
      throw new ProjectLogoUploadError(presignJson?.message || 'Unable to get logo upload URL.')
    }

    const upload_url = presignJson.data?.upload_url
    const logo_url = presignJson.data?.logo_url

    if (!upload_url || !logo_url) {
      throw new ProjectLogoUploadError('Unable to get logo upload URL.')
    }

    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': content_type },
      body: file
    }).catch((error: unknown) => {
      throw new ProjectLogoUploadError(error instanceof Error ? error.message : 'Upload logo failed.', 'network')
    })

    if (!uploadResponse.ok) {
      throw new ProjectLogoUploadError(`Upload logo failed (${uploadResponse.status}).`, 'storage', uploadResponse.status)
    }

    return logo_url
  },

  /**
   * Create flow: upload the selected logo first (if any), then create the project with the uploaded
   * URL as `logo_url`. If the upload fails, WF_BO_CREATE_PROJECT is not called.
   */
  async create_project_with_logo({
    sessiontoken,
    language,
    payload,
    logo_file
  }: {
    sessiontoken?: string
    language?: Locale
    payload: Omit<ProjectCreatePayload, 'logo_url'>
    logo_file: File | null
  }): Promise<ProjectDetailModel | null> {
    const logo_url = logo_file ? await this.upload_project_logo({ file: logo_file }) : ''

    return this.create_project_detail({ sessiontoken, language, payload: { ...payload, logo_url } })
  },

  async get_buildings_by_project_id({
    sessiontoken,
    language,
    project_id
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
  }): Promise<ProjectBuildingsByProjectResponseModel> {
    if (!sessiontoken) {
      return {
        buildings: [],
        total_floors: 0,
        total_apartments: 0,
        total_residents: 0
      }
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_BUILDINGS_WORKFLOW_ID,
      input: { project_id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load buildings.', language)

    const root = pickDataRoot(response)
    const buildings_raw = Array.isArray(root)
      ? root
      : getField(root, ['buildings']) ?? getField(root?.data, ['buildings'])
    const buildings = Array.isArray(buildings_raw) ? buildings_raw.map(mapProjectBuildingItem) : []

    return {
      buildings,
      total_floors: toOptionalNumber(getField(root, ['total_floors'])),
      total_apartments: toOptionalNumber(getField(root, ['total_apartments'])),
      total_residents: toOptionalNumber(getField(root, ['total_residents']))
    }
  },

  async get_project_contacts_by_project_id({
    sessiontoken,
    language,
    project_id
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
  }): Promise<ProjectContactItemModel[]> {
    if (!sessiontoken) return []

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_CONTACTS_WORKFLOW_ID,
      input: { project_id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load project contacts.', language)

    const root = pickDataRoot(response)
    const contacts_raw = Array.isArray(root)
      ? root
      : getField(root, ['contacts']) ?? getField(root?.data, ['contacts'])

    return Array.isArray(contacts_raw) ? contacts_raw.map(mapProjectContactItem) : []
  },

  async get_projects(filter: ProjectFilterModel) {
    await pause()
    recalculate_project_aggregate()

    return projects.filter(project => {
      return includes_keyword([project.project_name, project.project_code], filter.search_text)
    })
  },

  async get_project_by_code(project_code: string) {
    await pause()
    recalculate_project_aggregate()

    return projects.find(project => project.project_code === project_code) ?? null
  },

  async get_buildings(filter: BuildingFilterModel) {
    await pause()
    recalculate_project_aggregate()

    return buildings.filter(building => {
      const matches_project = !filter.project_code || building.project_code === filter.project_code
      const matches_keyword = includes_keyword([building.building_name, building.building_code], filter.keyword)
      const matches_status = filter.status === 'all' || building.status === filter.status

      return matches_project && matches_keyword && matches_status
    })
  },

  async get_project_buildings(project_code: string) {
    return this.get_buildings({ project_code, keyword: '', status: 'all' })
  },

  async get_project_site_plan(project_code: string): Promise<ProjectSitePlanModel | null> {
    await pause()
    recalculate_project_aggregate()

    const project = projects.find(item => item.project_code === project_code)
    if (!project) return null

    const plan = project_site_plans.find(item => item.project_code === project_code)
    const project_buildings = buildings.filter(building => building.project_code === project_code)

    if (!plan) {
      const items: ProjectSitePlanItem[] = project_buildings.map((building, index) => ({
        building_code: building.building_code,
        building_name: building.building_name,
        shape_type: 'rectangle',
        position_x: 180 + index * 180,
        position_y: 220,
        width: 130,
        depth: 82,
        height_level: building.total_floors,
        rotation: 0,
        display_order: building.display_order,
        total_floors: building.total_floors,
        total_units: building.total_units,
        active_residents: building.active_residents,
        status: building.status,
        last_modified: building.last_modified
      }))

      return {
        project_code,
        project_name: project.project_name,
        layout_type: 'custom',
        site_plan: {
          view_mode: 'isometric',
          canvas_width: 1200,
          canvas_height: 700,
          items
        }
      }
    }

    return {
      ...plan,
      project_name: project.project_name,
      site_plan: {
        ...plan.site_plan,
        items: plan.site_plan.items.map(item => {
          const building = project_buildings.find(row => row.building_code === item.building_code)

          return building
            ? {
                ...item,
                building_name: building.building_name,
                total_floors: building.total_floors,
                total_units: building.total_units,
                active_residents: building.active_residents,
                status: building.status,
                last_modified: building.last_modified
              }
            : item
        })
      }
    }
  },

  async get_floors(filter: FloorFilterModel) {
    await pause()
    recalculate_project_aggregate()

    return floors.filter(floor => {
      const matches_project = !filter.project_code || floor.project_code === filter.project_code
      const matches_building = !filter.building_code || floor.building_code === filter.building_code
      const matches_keyword = includes_keyword([floor.floor_code, String(floor.floor_no), floor.floor_name], filter.keyword)
      const matches_status = filter.status === 'all' || floor.status === filter.status

      return matches_project && matches_building && matches_keyword && matches_status
    })
  },

  async get_apartments(filter: ApartmentFilterModel) {
    await pause()

    return apartments.filter(apartment => {
      const matches_project = !filter.project_code || apartment.project_code === filter.project_code
      const matches_building = !filter.building_code || apartment.building_code === filter.building_code
      const matches_floor = !filter.floor_code || apartment.floor_code === filter.floor_code
      const matches_keyword = includes_keyword([apartment.apartment_code, apartment.apartment_no, apartment.owner_name], filter.keyword)
      const matches_status = filter.apartment_status === 'all' || apartment.status === filter.apartment_status
      const matches_qr =
        filter.qr_payment_enabled === 'all' ||
        (filter.qr_payment_enabled === 'yes' && apartment.qr_payment_enabled) ||
        (filter.qr_payment_enabled === 'no' && !apartment.qr_payment_enabled)

      return matches_project && matches_building && matches_floor && matches_keyword && matches_status && matches_qr
    })
  },

  async get_stacking_plan(filter: StackingPlanFilterModel): Promise<StackingPlanModel | null> {
    await pause()

    const building =
      buildings.find(item => item.project_code === filter.project_code && item.building_code === filter.building_code) ??
      buildings.find(item => item.project_code === filter.project_code) ??
      buildings[0]

    if (!building) return null

    const filtered_apartments = apartments.filter(apartment => {
      const matches_building = apartment.project_code === building.project_code && apartment.building_code === building.building_code
      const matches_floor = !filter.floor_code || apartment.floor_code === filter.floor_code
      const matches_status = filter.apartment_status === 'all' || apartment.status === filter.apartment_status
      const matches_keyword = includes_keyword([apartment.apartment_code, apartment.apartment_no, apartment.owner_name], filter.keyword)

      return matches_building && matches_floor && matches_status && matches_keyword
    })

    const plan_floors = floors
      .filter(floor => floor.project_code === building.project_code && floor.building_code === building.building_code && (!filter.floor_code || floor.floor_code === filter.floor_code))
      .sort((left, right) => right.floor_no - left.floor_no)
      .map(floor => {
        const floor_apartments = filtered_apartments.filter(apartment => apartment.floor_code === floor.floor_code)
        const layout = build_floor_layout(floor_apartments)

        return {
          floor_code: floor.floor_code,
          floor_no: floor.floor_no,
          floor_name: floor.floor_name,
          summary: build_floor_summary(floor_apartments),
          layout,
          apartments: layout.filter((item): item is FloorPlanApartmentItem => item.item_type === 'apartment')
        }
      })
      .filter(floor => floor.summary.total_units > 0)

    return {
      project_code: building.project_code,
      project_name: building.project_name,
      building_code: building.building_code,
      building_name: building.building_name,
      floors: plan_floors
    }
  },

  async get_apartment_detail(apartment_code: string): Promise<ApartmentDetailModel | null> {
    await pause()

    const apartment = apartments.find(item => item.apartment_code === apartment_code)

    return apartment ? build_apartment_detail(apartment) : null
  },

  async get_project_contacts(filter: ProjectContactFilterModel) {
    await pause()

    return project_contacts.filter(contact => {
      const matches_project = !filter.project_code || contact.project_code === filter.project_code
      const matches_type = filter.contact_type === 'all' || contact.contact_type === filter.contact_type
      const matches_keyword = includes_keyword([contact.contact_name, contact.phone_number, contact.email, contact.position], filter.keyword)
      const matches_status = filter.status === 'all' || contact.status === filter.status

      return matches_project && matches_type && matches_keyword && matches_status
    })
  },

  async get_project_contacts_by_project(project_code: string) {
    return this.get_project_contacts({ project_code, contact_type: 'all', keyword: '', status: 'all' })
  },

  async get_project_payment_configs(filter: ProjectPaymentConfigFilterModel) {
    await pause()

    return payment_configs.filter(config => {
      const matches_project = !filter.project_code || config.project_code === filter.project_code
      const matches_fee_type = !filter.fee_type_code || config.fee_type_code === filter.fee_type_code
      const matches_provider = !filter.payment_provider || config.payment_provider === filter.payment_provider
      const matches_qr =
        filter.qr_dynamic_enabled === 'all' ||
        (filter.qr_dynamic_enabled === 'yes' && config.qr_dynamic_enabled) ||
        (filter.qr_dynamic_enabled === 'no' && !config.qr_dynamic_enabled)
      const matches_status = filter.status === 'all' || config.status === filter.status

      return matches_project && matches_fee_type && matches_provider && matches_qr && matches_status
    })
  },

  async get_project_payment_configs_by_project(project_code: string) {
    return this.get_project_payment_configs({
      project_code,
      fee_type_code: '',
      payment_provider: '',
      qr_dynamic_enabled: 'all',
      status: 'all'
    })
  },

  async create_project(payload: ProjectPayload) {
    await pause()
    const project: ProjectModel = {
      ...payload,
      id: next_id(projects),
      name: payload.project_name,
      logo_url: payload.image_url || null,
      total_buildings: 0,
      total_floors: 0,
      total_units: 0,
      active_residents: 0,
      payment_config_status: 'pending',
      qr_payment_enabled: false,
      voucher_enabled: false,
      last_modified: now()
    }
    projects = [project, ...projects]

    return project
  },

  async update_project(id: number, payload: ProjectPayload) {
    await pause()
    projects = projects.map(project => (
      project.id === id
        ? { ...project, ...payload, name: payload.project_name, logo_url: payload.image_url || null, last_modified: now() }
        : project
    ))
  },

  async delete_project(id: number) {
    await pause()
    const project = projects.find(item => item.id === id)
    projects = projects.filter(item => item.id !== id)
    if (!project) return
    buildings = buildings.filter(item => item.project_code !== project.project_code)
    floors = floors.filter(item => item.project_code !== project.project_code)
    apartments = apartments.filter(item => item.project_code !== project.project_code)
  },

  async create_building(payload: BuildingPayload) {
    await pause()
    const building: BuildingModel = {
      ...payload,
      id: next_id(buildings),
      project_name: find_project_name(payload.project_code),
      total_units: 0,
      active_residents: 0,
      last_modified: now()
    }
    buildings = [building, ...buildings]
    recalculate_project_aggregate()

    return building
  },

  async update_building(id: number, payload: BuildingPayload) {
    await pause()
    buildings = buildings.map(building =>
      building.id === id
        ? { ...building, ...payload, project_name: find_project_name(payload.project_code), last_modified: now() }
        : building
    )
    recalculate_project_aggregate()
  },

  async delete_building(id: number) {
    await pause()
    const building = buildings.find(item => item.id === id)
    buildings = buildings.filter(item => item.id !== id)
    if (building) {
      floors = floors.filter(item => item.building_code !== building.building_code)
      apartments = apartments.filter(item => item.building_code !== building.building_code)
    }
    recalculate_project_aggregate()
  },

  async create_floor(payload: FloorPayload) {
    await pause()
    const floor: FloorModel = {
      ...payload,
      id: next_id(floors),
      project_name: find_project_name(payload.project_code),
      building_name: find_building_name(payload.building_code),
      total_units: 0,
      active_units: 0,
      last_modified: now()
    }
    floors = [floor, ...floors]
    recalculate_project_aggregate()

    return floor
  },

  async update_floor(id: number, payload: FloorPayload) {
    await pause()
    floors = floors.map(floor =>
      floor.id === id
        ? {
            ...floor,
            ...payload,
            project_name: find_project_name(payload.project_code),
            building_name: find_building_name(payload.building_code),
            last_modified: now()
          }
        : floor
    )
    recalculate_project_aggregate()
  },

  async delete_floor(id: number) {
    await pause()
    const floor = floors.find(item => item.id === id)
    floors = floors.filter(item => item.id !== id)
    if (floor) apartments = apartments.filter(item => item.floor_code !== floor.floor_code)
    recalculate_project_aggregate()
  },

  async create_apartment(payload: ApartmentPayload) {
    await pause()
    const apartment: ApartmentModel = {
      ...payload,
      water_meter_code: payload.water_meter_code.trim(),
      electricity_meter_code: payload.electricity_meter_code.trim(),
      id: next_id(apartments),
      project_name: find_project_name(payload.project_code),
      building_name: find_building_name(payload.building_code),
      floor_no: find_floor_no(payload.floor_code),
      last_modified: now()
    }
    apartments = [apartment, ...apartments]
    recalculate_project_aggregate()

    return apartment
  },

  async update_apartment(id: number, payload: ApartmentPayload) {
    await pause()
    apartments = apartments.map(apartment =>
      apartment.id === id
        ? {
            ...apartment,
            ...payload,
            project_name: find_project_name(payload.project_code),
            building_name: find_building_name(payload.building_code),
            floor_no: find_floor_no(payload.floor_code),
            last_modified: now()
          }
        : apartment
    )
    recalculate_project_aggregate()
  },

  async create_project_contact(payload: ProjectContactPayload) {
    await pause()
    project_contacts = [{ ...payload, id: next_id(project_contacts) }, ...project_contacts]
  },

  async update_project_contact(id: number, payload: ProjectContactPayload) {
    await pause()
    project_contacts = project_contacts.map(contact => (contact.id === id ? { ...contact, ...payload } : contact))
  },

  async delete_project_contact(id: number) {
    await pause()
    project_contacts = project_contacts.filter(item => item.id !== id)
  },

  async create_project_payment_config(payload: ProjectPaymentConfigPayload) {
    await pause()
    payment_configs = [
      {
        ...payload,
        id: next_id(payment_configs),
        project_name: find_project_name(payload.project_code),
        fee_type_name: payload.fee_type_code,
        last_modified: now()
      },
      ...payment_configs
    ]
  },

  async update_project_payment_config(id: number, payload: ProjectPaymentConfigPayload) {
    await pause()
    payment_configs = payment_configs.map(config =>
      config.id === id
        ? {
            ...config,
            ...payload,
            project_name: find_project_name(payload.project_code),
            fee_type_name: payload.fee_type_code,
            last_modified: now()
          }
        : config
    )
  },

  async delete_project_payment_config(id: number) {
    await pause()
    payment_configs = payment_configs.filter(item => item.id !== id)
  },

  is_duplicate_project_code(project_code: string, ignore_id?: number) {
    return projects.some(project => project.project_code.toLowerCase() === project_code.toLowerCase() && project.id !== ignore_id)
  },

  is_duplicate_building_code(project_code: string, building_code: string, ignore_id?: number) {
    return buildings.some(
      building =>
        building.project_code === project_code &&
        building.building_code.toLowerCase() === building_code.toLowerCase() &&
        building.id !== ignore_id
    )
  },

  is_duplicate_floor_code(building_code: string, floor_code: string, ignore_id?: number) {
    return floors.some(
      floor =>
        floor.building_code === building_code &&
        floor.floor_code.toLowerCase() === floor_code.toLowerCase() &&
        floor.id !== ignore_id
    )
  },

  is_duplicate_apartment_code(apartment_code: string, ignore_id?: number) {
    return apartments.some(
      apartment => apartment.apartment_code.toLowerCase() === apartment_code.toLowerCase() && apartment.id !== ignore_id
    )
  },

  is_duplicate_payment_config(payload: Pick<ProjectPaymentConfigPayload, 'project_code' | 'fee_type_code' | 'payment_provider'>, ignore_id?: number) {
    return payment_configs.some(
      config =>
        config.project_code === payload.project_code &&
        config.fee_type_code === payload.fee_type_code &&
        config.payment_provider === payload.payment_provider &&
        config.id !== ignore_id
    )
  },

  async change_project_status(id: number, status: PropertyStatus) {
    await pause()
    projects = projects.map(project => (project.id === id ? { ...project, status, last_modified: now() } : project))
  },

  async change_building_status(id: number, status: PropertyStatus) {
    await pause()
    buildings = buildings.map(building => (building.id === id ? { ...building, status, last_modified: now() } : building))
  },

  async change_floor_status(id: number, status: PropertyStatus) {
    await pause()
    floors = floors.map(floor => (floor.id === id ? { ...floor, status, last_modified: now() } : floor))
  }
}
