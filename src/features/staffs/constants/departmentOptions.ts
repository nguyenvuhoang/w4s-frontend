export type DepartmentOption = {
    department_code: string
    department_name: string
}

// Temporary local options until the Department Management module provides a codelist/API.
export const department_options: DepartmentOption[] = [
    { department_code: 'IT', department_name: 'Công nghệ thông tin' },
    { department_code: 'HR', department_name: 'Nhân sự' },
    { department_code: 'ACC', department_name: 'Kế toán' },
    { department_code: 'OPS', department_name: 'Vận hành' }
]
