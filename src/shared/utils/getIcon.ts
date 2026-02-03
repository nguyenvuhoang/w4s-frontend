import CheckCircleOutlineSharpIcon from '@mui/icons-material/CheckCircleOutlineSharp';
import DeleteOutlineSharpIcon from '@mui/icons-material/DeleteOutlineSharp';
import PrintSharpIcon from '@mui/icons-material/PrintSharp';
import VisibilitySharpIcon from '@mui/icons-material/VisibilitySharp';
import PlaylistAddSharpIcon from '@mui/icons-material/PlaylistAddSharp';
import EditNoteSharpIcon from '@mui/icons-material/EditNoteSharp';
import RemoveRoadSharpIcon from '@mui/icons-material/RemoveRoadSharp';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import React, { JSX } from 'react';

type IconKey = 'btn_delete' | 'btn_view' | 'btn_select' | 'btn_print' | 'view' | 'delete' | 'btn_add' | 'btn_update' | 'btn_clear' | 'add' | 'update' | 'clear' | 'upload' | 'search' | 'download_zip' | 'upload_zip' | 'advanced_search_button' | 'save' | 'modify' | 'apply' | 'preview' | 'export' | 'import';

const ICON_CONVERT: Record<IconKey, { color: string; icon: JSX.Element }> = {
    btn_delete: { color: "error", icon: React.createElement(DeleteOutlineSharpIcon) },
    btn_view: { color: "info", icon: React.createElement(VisibilitySharpIcon) },
    btn_select: { color: "success", icon: React.createElement(CheckCircleOutlineSharpIcon) },
    btn_print: { color: "primary", icon: React.createElement(PrintSharpIcon) },
    btn_add: { color: "primary", icon: React.createElement(PlaylistAddSharpIcon) },
    btn_update: { color: "primary", icon: React.createElement(EditNoteSharpIcon) },
    btn_clear: { color: "primary", icon: React.createElement(RemoveRoadSharpIcon) },
    view: { color: "info", icon: React.createElement(VisibilitySharpIcon) },
    delete: { color: "error", icon: React.createElement(DeleteOutlineSharpIcon) },
    add: { color: "primary", icon: React.createElement(PlaylistAddSharpIcon) },
    update: { color: "primary", icon: React.createElement(EditNoteSharpIcon) },
    clear: { color: "primary", icon: React.createElement(RemoveRoadSharpIcon) },
    upload: { color: "primary", icon: React.createElement(FileUploadIcon) },
    search: { color: "primary", icon: React.createElement(ManageSearchIcon) },
    download_zip: { color: "primary", icon: React.createElement(SystemUpdateAltIcon) },
    upload_zip: { color: "primary", icon: React.createElement(DriveFolderUploadIcon) },
    advanced_search_button: { color: "primary", icon: React.createElement(ManageSearchIcon) },
    modify: { color: "primary", icon: React.createElement(EditNoteSharpIcon) },
    save: { color: "primary", icon: React.createElement(CheckCircleOutlineSharpIcon) },
    apply: { color: "primary", icon: React.createElement(SaveOutlinedIcon) },
    preview: { color: "primary", icon: React.createElement(VisibilitySharpIcon) },
    export: { color: "primary", icon: React.createElement(SystemUpdateAltIcon) },
    import: { color: "primary", icon: React.createElement(FileUploadIcon) },
};

export function getIcon(input: { [x: string]: any; inputtype?: string; default?: any; config?: any }): JSX.Element | null {
    // Trả về icon từ ICON_CONVERT nếu tồn tại
    if (input.default?.code && ICON_CONVERT[input.default.code as IconKey]?.icon) {
        return ICON_CONVERT[input.default.code as IconKey]?.icon;
    }

    // Nếu không, kiểm tra config.icon
    if (!!input.config?.icon) {
        return input.config.icon;
    }

    // Trả về rỗng nếu không có icon
    return null;
}
