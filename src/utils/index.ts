
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UseFormSetError } from "react-hook-form"
import { EntityError } from "@/servers/lib/http";
import Swal from "sweetalert2"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const normalizePath = (path: string) => {
    return path.startsWith('/') ? path.slice(1) : path
}

export const handleErrorApi = ({
    error,
    setError,
    duration
}: {
    error: any
    setError?: UseFormSetError<any>
    duration?: number
}) => {
    if (error instanceof EntityError && setError) {
        error.payload.errors.forEach((item) => {
            setError(item.field, {
                type: 'server',
                message: item.message
            })
        })
    } else {
        Swal.fire({
            position: 'top',
            icon: 'error',
            color: 'red',
            title: 'Oops...',
            allowOutsideClick: false,
            customClass: {
                confirmButton: 'swal2-confirm'
            },
            text: error?.payload?.message ?? 'Lỗi không xác định'
        })
    }
}
