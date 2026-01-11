
'use client'

import * as Icons from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { Menu, MenuItem } from '@mui/material';
import React from 'react';
import { normalizeLang } from './normalizeLang';
import { Locale } from '@/configs/i18n';
import { getLocalizedText } from './getLocalizedText';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as FaIcons from "@fortawesome/free-solid-svg-icons";


export const generateCellTable = (
    column: { code: string; inputtype: string, onClick: any, config: any },
    value: any,
    rowData: any,
    input: any,
    handleOptionClick?: (action: string) => void,
    ismodify?: boolean,
    anchorEl?: HTMLElement | null,
    handleClose?: () => void,
    onClick?: (e: React.MouseEvent<SVGSVGElement | HTMLElement>, rowdata: any, input: any, ismodify?: boolean) => void,
    handlePreviewModal?: (content: any, previewtype: string, datatype?: string, app?: string) => void,
    language: Locale | undefined = 'en'
) => {

    switch (column.inputtype) {
        case 'ColumnString':
            return <span>{value}</span>;

        case 'ColumnNumber':
            return <span>{Number(value).toLocaleString()}</span>;

        case 'ColumnObject':

            const preview = column.config.preview === 'true'
            const previewtype = column.config.previewtype
            const app = column.config.app

            return (
                <span
                    style={{
                        display: 'inline-block',
                        position: 'relative',
                        cursor: 'pointer'
                    }}
                    title={
                        (() => {
                            try {
                                return JSON.stringify(JSON.parse(value));
                            } catch (error) {
                                return 'Invalid JSON';
                            }
                        })()
                    }
                    onClick={() => {
                        if (preview) {
                            if (handlePreviewModal) {
                                handlePreviewModal(value, previewtype, "JSON", app);
                            }
                        }
                    }}
                >
                    <ZoomOutMapIcon
                        style={{
                            fontSize: '20px',
                            marginRight: '8px',
                            color: (() => {
                                try {
                                    JSON.parse(value);
                                    return '#1976d2';
                                } catch (error) {
                                    console.warn(`Failed to parse JSON for value: ${value}`, error);
                                    return 'red';
                                }
                            })(),
                        }}
                    />
                </span>

            );

        case 'ColumnXML':
            const previewXML = column.config.preview === 'true'
            const previewtypeXML = column.config.previewtype
            const appxml = column.config.app

            return (
                <>
                    <span
                        style={{
                            cursor: 'pointer',
                            display: 'inline-block',
                        }}
                        title={column.config.title}
                        onClick={() => {
                            if (previewXML) {
                                if (handlePreviewModal) {
                                    handlePreviewModal(value, previewtypeXML, "XML", appxml);
                                }
                            }
                        }}
                    >
                        {value && <Icons.Code style={{ fontSize: '20px', color: 'red' }} />}
                    </span>
                </>
            );
        case 'status':
        case 'ColumnTag':
            const cfg = column?.config || {};
            const isDynamic = cfg?.dynamic === true;
            const item = isDynamic
                ? {
                    label: cfg?.showValue ? String(value ?? '') : '',
                    backgroundColor: String(value ?? ''),
                    color: String(value ?? ''), // không dùng text, chỉ để hợp logic
                }
                : cfg?.[value];

            const shape = cfg?.shape || 'rect';
            const size = cfg?.size ?? 16;
            if (isDynamic && shape === 'circle') {
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span
                            style={{
                                width: size,
                                height: size,
                                borderRadius: '50%',
                                backgroundColor: item?.backgroundColor || 'transparent',
                                border: `1px solid ${cfg?.borderColor || '#ddd'}`,
                                display: 'inline-block',
                            }}
                            title={String(value ?? '')}
                        />
                        {cfg?.showValue ? (
                            <span style={{ fontWeight: 600 }}>{String(value ?? '')}</span>
                        ) : null}
                    </span>
                );
            }

            if (cfg?.dynamicIcon === true) {
                const iconKey = String(value ?? '');
                const MuiIcon =
                    (Icons as any)[iconKey] ||
                    (Icons as any)[iconKey.charAt(0).toUpperCase() + iconKey.slice(1)];

                if (MuiIcon) {
                    return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {React.createElement(MuiIcon, {
                                style: { fontSize: cfg?.size ?? 18, color: cfg?.color ?? '#555' }
                            })}
                            {cfg?.showValue && <span>{iconKey}</span>}
                        </span>
                    );
                }

                if (iconKey.startsWith('fa')) {
                    const faName = iconKey
                    const FaIcon = (FaIcons as any)[faName];
                    if (FaIcon) {
                        return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <FontAwesomeIcon
                                    icon={FaIcon}
                                    style={{
                                        fontSize: cfg?.size ?? 18,
                                        color: cfg?.color ?? '#555'
                                    }}
                                />
                                {cfg?.showValue && <span>{iconKey}</span>}
                            </span>
                        );
                    }
                }

                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Icons.Help style={{ fontSize: cfg?.size ?? 18, color: '#999' }} />
                    </span>
                );
            }

            return (
                <span
                    style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: column?.config?.[value]?.backgroundColor || 'transparent',
                        color: column?.config?.[value]?.color || 'white',
                        fontWeight: 'bold',
                    }}
                >
                    {column?.config?.[value]?.label ? (
                        column?.config?.[value]?.label
                    ) : column?.config?.[value]?.icon ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {React.createElement(Icons[column?.config?.[value]?.icon as keyof typeof Icons] || Icons.Help, {
                                style: { fontSize: 16, color: column?.config?.[value]?.color || 'white' }
                            })}
                        </span>
                    ) : 'Unknown'}
                </span>
            );

        case 'cButtonOnTable':
            return (
                <span
                    style={{
                        display: 'inline-block',
                        position: 'relative',
                        cursor: 'pointer',
                    }}
                    title={ismodify ? 'Edit' : 'View'}
                >
                    {ismodify ? (
                        <>
                            <MoreVertIcon
                                style={{
                                    fontSize: '16px',
                                    color: '#f57c00',
                                }}
                                onClick={(e) => {
                                    if (onClick) onClick(e, rowData, input, ismodify);
                                }}
                            />
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <MenuItem onClick={() => handleOptionClick && handleOptionClick('copy')}>Copy to</MenuItem>
                                <MenuItem onClick={() => handleOptionClick && handleOptionClick('modify')}>Modify</MenuItem>
                                <MenuItem onClick={() => handleOptionClick && handleOptionClick('remove')}>Remove</MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <RemoveRedEyeIcon
                            style={{
                                fontSize: '16px',
                                color: '#1976d2',
                            }}
                            onClick={(e) => {
                                if (onClick) onClick(e, rowData, input, ismodify);
                            }}
                        />
                    )}
                </span>
            );

        case 'columnMask':
            try {
                if ((column.config.mask === 'dd/mm/yyyy' || column.config.mask === 'DD/MM/YYYY') && value) {
                    const date = new Date(value);
                    const formattedDate = date.toLocaleDateString('en-GB'); // Format as dd/mm/yyyy
                    return <span>{formattedDate}</span>;
                }
                return <span>{value || 'N/A'}</span>;
            } catch (error) {
                console.error('Error formatting date:', error);
                return <span>{value || 'Invalid Date'}</span>;
            }
        case 'ColumnMultiLanguage': {
            const getLang = language || 'en';
            // map "la" => "lo"
            const lang = getLang === 'la' ? 'lo' : getLang;
            const fallbacks = Array.isArray(column?.config?.fallbacks)
                ? column.config.fallbacks.map(normalizeLang)
                : ['en', 'vi', 'lo', 'zh']

            const text = getLocalizedText(value, lang, fallbacks)

            const showBadge = column?.config?.showBadge === true
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {showBadge && (
                        <span
                            style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 6,
                                border: '1px solid #ddd'
                            }}
                            title={`Language: ${lang}`}
                        >
                            {lang}
                        </span>
                    )}
                    <span>{text}</span>
                </span>
            )
        }

        default:
            return <span>{value || 'N/A'}</span>;
    }
};
