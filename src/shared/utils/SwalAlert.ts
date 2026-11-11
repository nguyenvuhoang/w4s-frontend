// SwalAlert.js

import Swal, { SweetAlertPosition } from 'sweetalert2';

type SwalAlertOptions = {
    title?: string
    cancelButtonText?: string
    /** Explicit HTML body, overriding the auto-derived text/error-block content (e.g. a structured result table). */
    html?: string
    /** Popup width in px (number) or any valid CSS width string — passed straight through to Swal.fire. */
    width?: number | string
    /** Small auto-closing toast: no backdrop, no OK button, does not take focus. */
    toast?: boolean
    /** Toast duration in ms (default 2000). */
    timer?: number
}

const TOAST_ICON_SIZE = 24

export const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const pickBackendErrorRoot = (value: any): any => (
    value?.response?.data?.payload?.dataresponse
    ?? value?.response?.data?.dataresponse
    ?? value?.response?.data
    ?? value?.data?.payload?.dataresponse
    ?? value?.data?.dataresponse
    ?? value?.data
    ?? value?.payload?.dataresponse
    ?? value?.payload
    ?? value
)

const normalizeAlertContent = (value: unknown) => {
    if (typeof value === 'string') return { displayText: value, htmlContent: undefined as string | undefined }

    const root = pickBackendErrorRoot(value)
    const errors = Array.isArray(root?.errors)
        ? root.errors
        : Array.isArray(root?.error)
            ? root.error
            : Array.isArray((value as any)?.errors)
                ? (value as any).errors
                : []
    const firstError = errors[0]
    const executionId = String(
        root?.execution_id
        ?? root?.executionId
        ?? root?.execute_id
        ?? firstError?.execution_id
        ?? firstError?.executionId
        ?? firstError?.execute_id
        ?? (value as any)?.execution_id
        ?? (value as any)?.executionId
        ?? (value as any)?.execute_id
        ?? ''
    ).trim()
    const message = String(
        firstError?.info
        ?? firstError?.message
        ?? firstError?.description
        ?? root?.message
        ?? (value as any)?.message
        ?? ''
    ).trim()

    if (executionId || message) {
        return {
            displayText: message,
            htmlContent: executionId
                ? `<div style="text-align: center;">${buildExecutionIdBlock(executionId)}<div>${escapeHtml(message)}</div></div>`
                : undefined
        }
    }

    return { displayText: '', htmlContent: undefined as string | undefined }
}

const buildExecutionIdBlock = (executionId: string) => (
    `<div style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        max-width:100%;
        margin-bottom:10px;
    ">
        <i style="
            color:#F70101;
            font-style:normal;
            font-weight:700;
            overflow-wrap:anywhere;
            word-break:break-word;
        ">${escapeHtml(executionId)}</i>

        <button
            type="button"
            class="swal-copy-execution-id"
            data-execution-id="${escapeHtml(executionId)}"
            aria-label="Sao chép"
            title="Sao chép"
            style="
                display:inline-flex;
                align-items:center;
                justify-content:center;
                width:28px;
                height:28px;
                padding:0;
                cursor:pointer;
                border:1px solid #F70101;
                background:#fff;
                color:#F70101;
                border-radius:6px;
            "
        >
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        </button>
    </div>`
)

const attachExecutionIdCopyHandlers = (popup: HTMLElement | undefined) => {
    if (!popup) return

    popup
        .querySelectorAll<HTMLButtonElement>('.swal-copy-execution-id')
        .forEach(button => {
            button.addEventListener('click', async () => {
                const executionId =
                    button.getAttribute('data-execution-id') ?? ''

                if (!executionId) return

                try {
                    await navigator.clipboard.writeText(executionId)

                    button.title = 'Đã sao chép'
                    button.setAttribute('aria-label', 'Đã sao chép')

                    setTimeout(() => {
                        button.title = 'Sao chép'
                        button.setAttribute('aria-label', 'Sao chép')
                    }, 1500)
                } catch {
                    // Không làm crash alert nếu clipboard bị chặn.
                }
            })
        })
}

const SwalAlert = (type: string,
    text: unknown,
    position: SweetAlertPosition | undefined = 'top',
    allowOutsideClick: boolean = true,
    showCancelButton: boolean = false,
    withConfirm: boolean = false,
    functional?: () => void,
    confirmButtonText: string | undefined = 'OK',
    options?: SwalAlertOptions
) => {
    let iconHtml;
    switch (type) {
        case 'error':
            iconHtml = '<img src="/images/icon/error.svg" alt="error-icon" style="width:64px; height:64px;">';
            break;
        case 'success':
            iconHtml = '<img src="/images/icon/success.svg" alt="success-icon" style="width:64px; height:64px;">';
            break;
        case 'warning':
            iconHtml = '<img src="/images/icon/warning.svg" alt="warning-icon" style="width:64px; height:64px;">';
            break;
        case 'question':
            iconHtml = '<img src="/images/icon/question.svg" alt="question-icon" style="width:64px; height:64px;">';
            break;
        default:
            iconHtml = '<img src="/images/icon/info.svg" alt="info-icon" style="width:64px; height:64px;">';
    }

    if (options?.toast) {
        Swal.fire({
            toast: true,
            position: position,
            color: 'black',
            titleText: typeof text === 'string' ? text : options.title,
            iconHtml: iconHtml.replace(/64px/g, `${TOAST_ICON_SIZE}px`),
            showConfirmButton: false,
            timer: options.timer ?? 2000,
            customClass: {
                icon: 'no-border'
            }
        });

        return;
    }

    // Parse backend workflow errors or legacy ExecutionId strings.
    let { displayText, htmlContent } = normalizeAlertContent(text);

    if (!htmlContent && displayText.includes('ExecutionId:')) {
        const match = displayText.match(/ExecutionId:\s*([^:]+):\s*(.+)/);
        if (match) {
            const executionId = match[1].trim();
            const message = match[2].trim();
            htmlContent = `<div style="text-align: center;">${buildExecutionIdBlock(executionId)}<div>${escapeHtml(message)}</div></div>`;
            displayText = ''; // Clear text when using html
        }
    }

    // Explicit html override (e.g. a structured result table) always wins over the auto-derived content.
    if (options?.html) {
        htmlContent = options.html;
        displayText = '';
    }

    if (withConfirm) {
        Swal.fire({
            title: options?.title,
            position: position,
            color: 'black',
            text: displayText || undefined,
            html: htmlContent,
            width: options?.width,
            allowOutsideClick: allowOutsideClick,
            showCancelButton: showCancelButton,
            iconHtml: iconHtml,
            confirmButtonText: confirmButtonText,
            cancelButtonText: showCancelButton ? options?.cancelButtonText ?? 'No' : undefined,
            customClass: {
                icon: 'no-border'
            },
            didOpen: (popup) => attachExecutionIdCopyHandlers(popup)
        }).then((result) => {
            if (result.isConfirmed) {
                if (functional) {
                    functional();
                } else {
                    window.location.reload();
                }
            }
        });
    } else {
        Swal.fire({
            title: options?.title,
            position: position,
            color: 'black',
            text: displayText || undefined,
            html: htmlContent,
            width: options?.width,
            allowOutsideClick: allowOutsideClick,
            showCancelButton: showCancelButton,
            iconHtml: iconHtml,
            customClass: {
                icon: 'no-border'
            },
            didOpen: (popup) => attachExecutionIdCopyHandlers(popup)
        });
    }


};

export default SwalAlert;
