// SwalAlert.js

import Swal, { SweetAlertPosition } from 'sweetalert2';

const SwalAlert = (type: string,
    text: string,
    position: SweetAlertPosition | undefined = 'top',
    allowOutsideClick: boolean = true,
    showCancelButton: boolean = false,
    withConfirm: boolean = false,
    functional?: () => void,
    confirmButtonText: string | undefined = 'OK'
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

    if (withConfirm) {
        Swal.fire({
            position: position,
            color: 'black',
            text: text,
            allowOutsideClick: allowOutsideClick,
            showCancelButton: showCancelButton,
            iconHtml: iconHtml,
            confirmButtonText: confirmButtonText,
            cancelButtonText: showCancelButton ? 'No' : undefined,
            customClass: {
                icon: 'no-border'
            }
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
            position: position,
            color: 'black',
            text: text,
            allowOutsideClick: allowOutsideClick,
            showCancelButton: showCancelButton,
            iconHtml: iconHtml,
            customClass: {
                icon: 'no-border'
            }
        });
    }


};

export default SwalAlert;
