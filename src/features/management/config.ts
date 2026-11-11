import type { ManagementField, ManagementScreenConfig } from './types'

const field = (key: string, label: string, type: ManagementField['type'] = 'text', required = false): ManagementField => ({
  key,
  label,
  type,
  required
})

const statusField: ManagementField = {
  key: 'status',
  label: 'Status',
  type: 'select',
  required: true,
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]
}

const fields = (...items: ManagementField[]) => [...items, statusField]

const screen = (key: string, title: string, screenFields: ManagementField[]): ManagementScreenConfig => ({
  key,
  title,
  route: `/${key}`,
  endpointTodo: `TODO: map ${title} to real IPS Admin API endpoint/workflow.`,
  fields: screenFields
})

export const managementScreens: ManagementScreenConfig[] = [
  screen('overview', 'Overview', fields(field('overviewCode', 'Overview Code', 'text', true), field('name', 'Name', 'text', true), field('description', 'Description'))),
  screen('staffs', 'Staffs', fields(field('staffCode', 'Staff Code', 'text', true), field('fullName', 'Full Name', 'text', true), field('email', 'Email'), field('phoneNumber', 'Phone Number'), field('role', 'Role'), field('department', 'Department'))),
  screen('residents-tenants', 'Residents/Tenants', fields(field('residentCode', 'Resident Code', 'text', true), field('fullName', 'Full Name', 'text', true), field('phoneNumber', 'Phone Number'), field('email', 'Email'), field('project', 'Project'), field('building', 'Building'), field('floor', 'Floor'), field('unit', 'Unit'), field('residentType', 'Resident Type'))),
  screen('company', 'Company', fields(field('companyCode', 'Company Code', 'text', true), field('companyName', 'Company Name', 'text', true), field('taxCode', 'Tax Code'), field('phoneNumber', 'Phone Number'), field('email', 'Email'), field('address', 'Address'))),
  screen('contracts', 'Contracts', fields(field('contractNo', 'Contract No', 'text', true), field('contractCategory', 'Contract Category'), field('companyResident', 'Company/Resident'), field('project', 'Project'), field('building', 'Building'), field('unit', 'Unit'), field('startDate', 'Start Date', 'date'), field('endDate', 'End Date', 'date'))),
  screen('contract-category', 'Contract Category', fields(field('categoryCode', 'Category Code', 'text', true), field('categoryName', 'Category Name', 'text', true), field('description', 'Description'))),
  screen('sales', 'Sales', fields(field('saleCode', 'Sale Code', 'text', true), field('customerName', 'Customer Name', 'text', true), field('project', 'Project'), field('building', 'Building'), field('unit', 'Unit'), field('amount', 'Amount', 'currency'), field('saleDate', 'Sale Date', 'date'))),
  screen('lease', 'Lease', fields(field('leaseCode', 'Lease Code', 'text', true), field('tenantName', 'Tenant Name', 'text', true), field('project', 'Project'), field('building', 'Building'), field('unit', 'Unit'), field('startDate', 'Start Date', 'date'), field('endDate', 'End Date', 'date'), field('monthlyFee', 'Monthly Fee', 'currency'))),
  screen('project', 'Project', fields(field('projectCode', 'Project Code', 'text', true), field('projectName', 'Project Name', 'text', true), field('address', 'Address'), field('description', 'Description'))),
  screen('building', 'Building', fields(field('buildingCode', 'Building Code', 'text', true), field('buildingName', 'Building Name', 'text', true), field('project', 'Project'), field('totalFloor', 'Total Floor', 'number'))),
  screen('floor', 'Floor', fields(field('floorCode', 'Floor Code', 'text', true), field('floorName', 'Floor Name', 'text', true), field('project', 'Project'), field('building', 'Building'), field('floorNumber', 'Floor Number', 'number'))),
  screen('unit', 'Unit', fields(field('unitCode', 'Unit Code', 'text', true), field('unitName', 'Unit Name', 'text', true), field('project', 'Project'), field('building', 'Building'), field('floor', 'Floor'), field('area', 'Area', 'number'), field('unitType', 'Unit Type'))),
  screen('stacking-plan', 'Stacking Plan', fields(field('project', 'Project', 'text', true), field('building', 'Building', 'text', true), field('floor', 'Floor'), field('unit', 'Unit'), field('displayOrder', 'Display Order', 'number'))),
  screen('resident-documents', 'Resident Documents', fields(field('documentCode', 'Document Code', 'text', true), field('documentName', 'Document Name', 'text', true), field('documentType', 'Document Type'), field('category', 'Category'), field('fileUrl', 'File URL'))),
  screen('internal-documents', 'Internal Documents', fields(field('documentCode', 'Document Code', 'text', true), field('documentName', 'Document Name', 'text', true), field('documentType', 'Document Type'), field('category', 'Category'), field('fileUrl', 'File URL'))),
  screen('announcement', 'Announcement', fields(field('title', 'Title', 'text', true), field('targetGroup', 'Target Group'), field('startDate', 'Start Date', 'date'), field('endDate', 'End Date', 'date'), field('publishStatus', 'Publish Status'))),
  screen('feedback', 'Feedback', fields(field('feedbackNo', 'Feedback No', 'text', true), field('residentName', 'Resident Name'), field('category', 'Category'), field('title', 'Title'), field('priority', 'Priority'), field('processingStatus', 'Processing Status'))),
  screen('feedback-config', 'Feedback Config', fields(field('configCode', 'Config Code', 'text', true), field('configName', 'Config Name', 'text', true), field('category', 'Category'), field('SLA', 'SLA'))),
  screen('visitors', 'Visitors', fields(field('visitorName', 'Visitor Name', 'text', true), field('phoneNumber', 'Phone Number'), field('residentName', 'Resident Name'), field('unit', 'Unit'), field('visitDate', 'Visit Date', 'date'), field('checkInStatus', 'Check In Status'))),
  screen('contact-info', 'Contact Info', fields(field('contactName', 'Contact Name', 'text', true), field('contactType', 'Contact Type'), field('phoneNumber', 'Phone Number'), field('email', 'Email'), field('project', 'Project'), field('building', 'Building'))),
  screen('service-requests', 'Service Requests', fields(field('requestNo', 'Request No', 'text', true), field('residentName', 'Resident Name'), field('category', 'Category'), field('title', 'Title'), field('priority', 'Priority'), field('assignee', 'Assignee'), field('processingStatus', 'Processing Status'))),
  screen('my-service-requests', 'My Service Requests', fields(field('requestNo', 'Request No', 'text', true), field('category', 'Category'), field('title', 'Title'), field('priority', 'Priority'), field('processingStatus', 'Processing Status'))),
  screen('service-requests-config', 'Service Requests Config', fields(field('categoryCode', 'Category Code', 'text', true), field('categoryName', 'Category Name', 'text', true), field('SLA', 'SLA'), field('priority', 'Priority'))),
  screen('facilities', 'Facilities', fields(field('facilityCode', 'Facility Code', 'text', true), field('facilityName', 'Facility Name', 'text', true), field('location', 'Location'), field('capacity', 'Capacity', 'number'), field('bookingRequired', 'Booking Required', 'boolean'))),
  screen('manage-booking', 'Manage Booking', fields(field('bookingNo', 'Booking No', 'text', true), field('facilityName', 'Facility Name'), field('residentName', 'Resident Name'), field('bookingDate', 'Booking Date', 'date'), field('timeSlot', 'Time Slot'), field('approvalStatus', 'Approval Status'))),
  screen('facility-blacklist', 'Facility Blacklist', fields(field('residentName', 'Resident Name', 'text', true), field('unit', 'Unit'), field('reason', 'Reason'), field('startDate', 'Start Date', 'date'), field('endDate', 'End Date', 'date'))),
  screen('monthly-package', 'Monthly Package', fields(field('packageCode', 'Package Code', 'text', true), field('packageName', 'Package Name', 'text', true), field('facilityName', 'Facility Name'), field('price', 'Price', 'currency'), field('duration', 'Duration'))),
  screen('generate-fee', 'Generate Fee', fields(field('feePeriod', 'Fee Period', 'text', true), field('feeType', 'Fee Type'), field('project', 'Project'), field('building', 'Building'), field('generatedDate', 'Generated Date', 'date'), field('generatedBy', 'Generated By'))),
  screen('fee-notice', 'Fee Notice', fields(field('noticeNo', 'Notice No', 'text', true), field('feePeriod', 'Fee Period'), field('residentName', 'Resident Name'), field('unit', 'Unit'), field('amount', 'Amount', 'currency'), field('dueDate', 'Due Date', 'date'))),
  screen('fee-statement', 'Fee Statement', fields(field('statementNo', 'Statement No', 'text', true), field('feePeriod', 'Fee Period'), field('residentName', 'Resident Name'), field('unit', 'Unit'), field('totalAmount', 'Total Amount', 'currency'), field('paidAmount', 'Paid Amount', 'currency'))),
  screen('receipt-voucher', 'Receipt & Voucher', fields(field('receiptNo', 'Receipt No', 'text', true), field('residentName', 'Resident Name'), field('unit', 'Unit'), field('amount', 'Amount', 'currency'), field('paymentDate', 'Payment Date', 'date'), field('paymentMethod', 'Payment Method'))),
  screen('cash-advance', 'Cash Advance', fields(field('advanceNo', 'Advance No', 'text', true), field('requester', 'Requester'), field('amount', 'Amount', 'currency'), field('purpose', 'Purpose'), field('requestDate', 'Request Date', 'date'), field('approvalStatus', 'Approval Status'))),
  screen('water', 'Water', fields(field('readingPeriod', 'Reading Period', 'text', true), field('project', 'Project'), field('building', 'Building'), field('unit', 'Unit'), field('oldIndex', 'Old Index', 'number'), field('newIndex', 'New Index', 'number'), field('consumption', 'Consumption', 'number'))),
  screen('items', 'Items', fields(field('itemCode', 'Item Code', 'text', true), field('itemName', 'Item Name', 'text', true), field('category', 'Category'), field('unit', 'Unit'), field('minimumStock', 'Minimum Stock', 'number'))),
  screen('inventory', 'Inventory', fields(field('transactionNo', 'Transaction No', 'text', true), field('itemName', 'Item Name'), field('transactionType', 'Transaction Type'), field('quantity', 'Quantity', 'number'), field('warehouse', 'Warehouse'), field('transactionDate', 'Transaction Date', 'date'))),
  screen('calendar-view', 'Calendar View', fields(field('maintenanceNo', 'Maintenance No', 'text', true), field('title', 'Title'), field('assetName', 'Asset Name'), field('scheduledDate', 'Scheduled Date', 'date'), field('assignee', 'Assignee'))),
  screen('list-view', 'List View', fields(field('maintenanceNo', 'Maintenance No', 'text', true), field('title', 'Title'), field('assetName', 'Asset Name'), field('scheduledDate', 'Scheduled Date', 'date'), field('priority', 'Priority'), field('processingStatus', 'Processing Status'))),
  screen('my-planned-maintenance', 'My Planned Maintenance', fields(field('maintenanceNo', 'Maintenance No', 'text', true), field('title', 'Title'), field('assetName', 'Asset Name'), field('scheduledDate', 'Scheduled Date', 'date'), field('processingStatus', 'Processing Status'))),
  screen('pipeline-view', 'Pipeline View', fields(field('maintenanceNo', 'Maintenance No', 'text', true), field('title', 'Title'), field('stage', 'Stage'), field('assignee', 'Assignee'), field('priority', 'Priority'))),
  screen('assets', 'Assets', fields(field('assetCode', 'Asset Code', 'text', true), field('assetName', 'Asset Name', 'text', true), field('assetType', 'Asset Type'), field('location', 'Location'), field('purchaseDate', 'Purchase Date', 'date'), field('warrantyDate', 'Warranty Date', 'date'))),
  screen('asset-types', 'Asset Types', fields(field('assetTypeCode', 'Asset Type Code', 'text', true), field('assetTypeName', 'Asset Type Name', 'text', true), field('description', 'Description'))),
  screen('form-management', 'Form Management', fields(field('formCode', 'Form Code', 'text', true), field('formName', 'Form Name', 'text', true), field('category', 'Category'), field('version', 'Version'), field('publishStatus', 'Publish Status'))),
  screen('response-form', 'Response Form', fields(field('responseNo', 'Response No', 'text', true), field('formName', 'Form Name'), field('submitter', 'Submitter'), field('submittedAt', 'Submitted At', 'date'), field('processingStatus', 'Processing Status'))),
  screen('delivery', 'Delivery', fields(field('deliveryNo', 'Delivery No', 'text', true), field('receiverName', 'Receiver Name'), field('unit', 'Unit'), field('packageType', 'Package Type'), field('receivedDate', 'Received Date', 'date'), field('pickupStatus', 'Pickup Status'))),
  screen('parking', 'Parking', fields(field('parkingCode', 'Parking Code', 'text', true), field('parkingSlot', 'Parking Slot'), field('vehicleNo', 'Vehicle No'), field('residentName', 'Resident Name'), field('unit', 'Unit'), field('vehicleType', 'Vehicle Type'))),
  screen('banners', 'Banners', fields(field('bannerName', 'Banner Name', 'text', true), field('type', 'Type'), field('startDate', 'Start Date', 'date'), field('endDate', 'End Date', 'date'), field('totalView', 'Total View', 'number'))),
  screen('fee-setting', 'Fee Setting', fields(field('feeCode', 'Fee Code', 'text', true), field('feeName', 'Fee Name', 'text', true), field('feeType', 'Fee Type'), field('calculationMethod', 'Calculation Method'), field('cycle', 'Cycle'))),
  screen('user', 'User', fields(field('username', 'Username', 'text', true), field('fullName', 'Full Name', 'text', true), field('email', 'Email'), field('role', 'Role'))),
  screen('language', 'Language', fields(field('languageCode', 'Language Code', 'text', true), field('languageName', 'Language Name', 'text', true), field('locale', 'Locale'), field('isDefault', 'Is Default', 'boolean')))
]

export const managementScreenByRoute = new Map(managementScreens.map(item => [item.route, item]))

export const findManagementScreenByPath = (path: string) => managementScreenByRoute.get(path)
