'use client';

import CountryFlag from '@/@core/components/mui/CountryFlag';
import { Locale } from '@/configs/i18n';
import { PageContentProps } from '@shared/types';
import { LanguageDataMobileType, PageLanguageResponse } from '@shared/types/bankType';
import { flattenJson } from '@utils/flattenJson';
import { getDictionary } from '@utils/getDictionary';
import { parseMaybeJson } from '@utils/parseMaybeJson';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { SxProps } from '@mui/material/styles';
import { Session } from 'next-auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';

// ðŸ‘‡ náº¿u path khÃ¡c, sá»­a láº¡i cho Ä‘Ãºng dá»± Ã¡n cá»§a báº¡n
import PaginationPage from '@/@core/components/jTable/pagination';
import { SelectChangeEvent } from '@mui/material/Select';

type PageProps = PageContentProps & {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    session: Session | null;
    locale: Locale;
    languageData: PageLanguageResponse<LanguageDataMobileType[]>;
};

const nameMap: Record<string, string> = { vi: 'VietNam', en: 'English', lo: 'Lao', zh: 'Chinese' };
const countryFlagMap: Record<string, string> = { vi: 'vn', zh: 'cn', lo: 'la', en: 'gb' };

const isEqual = (a?: string, b?: string) => (a ?? '') === (b ?? '');
const cellKey = (lang: string, key: string) => `${lang}__${key}`;

/* ================= Row component (memo) ================= */
type RowProps = {
    idx: number;
    keyPath: string;
    langs: string[];
    getValue: (lang: string, keyPath: string) => string;
    selected: boolean;
    editingLang: string;
    startEdit: (lang: string, keyPath: string) => void;
    cancelEdit: () => void;
    saveCell: (lang: string, keyPath: string, value: string) => void;
    isChanged: (lang: string, keyPath: string) => boolean;
    isUnchangedEdited: (lang: string, keyPath: string) => boolean;
};

const cellBaseSx: SxProps = { py: 0.5 };

const MemoRow = React.memo(function MemoRow({
    idx,
    keyPath,
    langs,
    getValue,
    selected,
    editingLang,
    startEdit,
    cancelEdit,
    saveCell,
    isChanged,
    isUnchangedEdited
}: RowProps) {
    return (
        <TableRow key={keyPath} selected={selected} sx={{ '&.Mui-selected': { bgcolor: '#e9eef7' } }}>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{keyPath}</TableCell>

            {langs.map(code => {
                const editing = selected && editingLang === code;
                const value = getValue(code, keyPath);
                const changed = isChanged(code, keyPath);
                const unchangedEdited = isUnchangedEdited(code, keyPath);

                const sx: SxProps = { ...cellBaseSx };
                if (changed) (sx as any).fontWeight = 700;
                if (unchangedEdited) (sx as any).color = 'error.main';

                return (
                    <TableCell key={code} sx={sx}>
                        {!editing ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>{value}</Box>
                                <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => startEdit(code, keyPath)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ) : (
                            <EditableCell
                                lang={code}
                                keyPath={keyPath}
                                initialValue={value}
                                onSave={saveCell}
                                onCancel={cancelEdit}
                            />
                        )}
                    </TableCell>
                );
            })}
        </TableRow>
    );
});

/* ========== Editing input ========== */
function EditableCell({
    lang,
    keyPath,
    initialValue,
    onSave,
    onCancel
}: {
    lang: string;
    keyPath: string;
    initialValue: string;
    onSave: (lang: string, keyPath: string, value: string) => void;
    onCancel: () => void;
}) {
    const [draft, setDraft] = useState(initialValue);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
                size="small"
                fullWidth
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') onSave(lang, keyPath, draft);
                    if (e.key === 'Escape') onCancel();
                }}
                autoFocus
            />
            <Tooltip title="Save">
                <IconButton size="small" color="success" onClick={() => onSave(lang, keyPath, draft)}>
                    <CheckIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
                <IconButton size="small" onClick={onCancel}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

/* ================= Page component ================= */
export default function LanguageManagementContent({
    dictionary,
    session,
    locale,
    languageData
}: PageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Server payload
    const items = languageData.items ?? [];
    const totalItems = languageData.total_items ?? items.length;
    const pageIndex = languageData.page_index ?? 0; // 0-based
    const pageSize = languageData.page_size || items.length || 50;
    const totalPages =
        languageData.total_pages ?? Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));

    // Local state mirror cho PaginationPage (Pagination cá»§a MUI nháº­n 1-based)
    const [page, setPage] = useState<number>(pageIndex + 1); // 1-based
    const [rowsPerPage, setRowsPerPage] = useState<number>(pageSize);
    const [jumpPage, setJumpPage] = useState<number>(pageIndex + 1);

    // Search
    const [search, setSearch] = useState(searchParams.get('q') ?? '');
    const deferredSearch = useDeferredValue(search);

    // Original maps
    const originalMaps = useMemo(() => {
        const init: Record<string, Record<string, string>> = {};
        (items ?? []).forEach(item => {
            const lang = (item.language || '').toLowerCase();
            const parsed = parseMaybeJson(item.json_content) || {};
            init[lang] = flattenJson(parsed);
        });
        return init;
    }, [items]);

    // Editable maps
    const [cellMaps, setCellMaps] = useState<Record<string, Record<string, string>>>(originalMaps);

    // Editing
    const [editing, setEditing] = useState<{ key: string; lang: string } | null>(null);

    // Change markers
    const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
    const [unchangedEditedCells, setUnchangedEditedCells] = useState<Set<string>>(new Set());

    const langs = useMemo(() => (items ?? []).map(x => x.language.toLowerCase()), [items]);

    // Keys
    const allKeys = useMemo(() => {
        const src = originalMaps;
        return Array.from(new Set(Object.values(src).flatMap(m => Object.keys(m)))).sort();
    }, [originalMaps]);

    const searchIndex = useMemo(() => {
        const idx: Record<string, string> = {};
        allKeys.forEach(k => {
            let blob = k.toLowerCase();
            for (const lg of langs) {
                const v = originalMaps[lg]?.[k];
                if (v) blob += ' ' + v.toLowerCase();
            }
            idx[k] = blob;
        });
        return idx;
    }, [allKeys, langs, originalMaps]);

    const filteredKeys = useMemo(() => {
        const q = deferredSearch.trim().toLowerCase();
        if (!q) return allKeys;
        return allKeys.filter(k => searchIndex[k]?.includes(q));
    }, [deferredSearch, allKeys, searchIndex]);

    /* -------- stable getters/handlers -------- */
    const getValue = useCallback(
        (lang: string, keyPath: string) => cellMaps[lang]?.[keyPath] ?? '',
        [cellMaps]
    );

    const startEdit = useCallback((lang: string, keyPath: string) => {
        setEditing({ lang, key: keyPath });
    }, []);

    const cancelEdit = useCallback(() => {
        setEditing(null);
    }, []);

    const saveCell = useCallback(
        async (lang: string, keyPath: string, value: string) => {
            const before = originalMaps[lang]?.[keyPath] ?? '';
            const after = value ?? '';

            setCellMaps(prev => ({
                ...prev,
                [lang]: { ...(prev[lang] || {}), [keyPath]: after }
            }));

            const id = cellKey(lang, keyPath);
            setChangedCells(prev => {
                const next = new Set(prev);
                if (!isEqual(before, after)) next.add(id);
                else next.delete(id);
                return next;
            });
            setUnchangedEditedCells(prev => {
                const next = new Set(prev);
                if (isEqual(before, after)) next.add(id);
                else next.delete(id);
                return next;
            });

            setEditing(null);
        },
        [originalMaps]
    );

    const isChanged = useCallback(
        (lang: string, keyPath: string) => changedCells.has(cellKey(lang, keyPath)),
        [changedCells]
    );
    const isUnchangedEdited = useCallback(
        (lang: string, keyPath: string) => unchangedEditedCells.has(cellKey(lang, keyPath)),
        [unchangedEditedCells]
    );

    /* ====== Pagination (server-driven via query) ====== */
    const updateQuery = useCallback(
        (params: Record<string, string | number | undefined>) => {
            const sp = new URLSearchParams(searchParams?.toString() ?? '');
            Object.entries(params).forEach(([k, v]) => {
                if (v === undefined || v === null || v === '') sp.delete(k);
                else sp.set(k, String(v));
            });
            router.replace(`${pathname}?${sp.toString()}`);
        },
        [router, pathname, searchParams]
    );

    const toPage = useCallback(
        (p0: number) => {
            // p0: 0-based
            if (p0 < 0 || p0 >= totalPages) return;
            updateQuery({ page_index: p0 });
        },
        [totalPages, updateQuery]
    );

    const changeSize = useCallback(
        (size: number) => {
            updateQuery({ page_size: size, page_index: 0 });
        },
        [updateQuery]
    );

    const applyServerSearch = useCallback(() => {
        updateQuery({ q: search, page_index: 0 });
    }, [search, updateQuery]);

    // ===== Handlers theo CHá»® KÃ mÃ  báº¡n cung cáº¥p =====
    // Pagination (MUI) -> (event, value) value lÃ  1-based
    const handlePageChange = useCallback(
        (event: React.ChangeEvent<unknown>, value: number) => {
            setPage(value);       // giá»¯ 1-based cho UI
            setJumpPage(value);
            toPage(value - 1);    // convert vá» 0-based cho API/query
        },
        [toPage]
    );

    // Page size (MUI Select) -> (event)
    const handlePageSizeChange = useCallback(
        (event: SelectChangeEvent<number>) => {
            const newSize = Number(event.target.value);
            setRowsPerPage(newSize);
            setPage(1);
            setJumpPage(1);
            changeSize(newSize);  // Ä‘á»•i size vÃ  reset vá» trang 0 á»Ÿ server
        },
        [changeSize]
    );

    // Jump to page (TextField onChange) -> (event)
    const handleJumpPage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = Number(event.target.value);
            const max = Math.max(1, totalPages);
            if (!Number.isFinite(value)) return;

            setJumpPage(value);

            if (value >= 1 && value <= max) {
                setPage(value);       // 1-based
                toPage(value - 1);    // 0-based cho server
            }
        },
        [totalPages, toPage]
    );

    return (
        <ContentWrapper
            title="Language management"
            description="Manage all languages in the application, created languages are not deleted!"
            icon={<></>}
            dictionary={dictionary}
            issearch={false}
        >
            <Box sx={{ my: 5, width: '100%' }}>
                {/* LANGUAGE LIST */}
                <Card variant="outlined" sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            {dictionary['language']?.title}
                        </Typography>

                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell>
                                            <b>{dictionary['language']?.code} (Two lowercase characters)</b>
                                        </TableCell>
                                        <TableCell>
                                            <b>{dictionary['common']?.name}</b>
                                        </TableCell>
                                        <TableCell>
                                            <b>{dictionary['language']?.image}</b>
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((lang, index) => {
                                        const code = lang.language.toLowerCase();
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{code}</TableCell>
                                                <TableCell>{nameMap[code] || code}</TableCell>
                                                <TableCell>
                                                    <CountryFlag countryCode={countryFlagMap[code]} size={28} />
                                                </TableCell>
                                                <TableCell />
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: 'flex', gap: 2, mt: 5 }}>
                            <Button variant="contained" color="primary" startIcon={<SaveIcon />}>
                                {dictionary['language']?.save}
                            </Button>
                            <Button variant="outlined" startIcon={<AddIcon />}>
                                {dictionary['language']?.add}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* DETAIL LIST */}
                <Card variant="outlined">
                    <CardContent>
                        {/* Header: search */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">{dictionary['language']?.detaillist}</Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TextField
                                    size="small"
                                    placeholder={dictionary['common']?.search ?? 'Search...'}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    sx={{ width: 280 }}
                                />
                                <Button variant="outlined" onClick={applyServerSearch}>
                                    {dictionary['common']?.search ?? 'Search'}
                                </Button>
                            </Box>
                        </Box>

                        {/* Báº£ng dá»¯ liá»‡u */}
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
                                <TableHead
                                    sx={{
                                        bgcolor: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                                        boxShadow: 'inset 0 -2px 0 #ddd',
                                        '& th': {
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            color: '#333',
                                            textTransform: 'capitalize',
                                            borderBottom: '2px solid #ddd'
                                        }
                                    }}
                                >
                                    <TableRow>
                                        <TableCell>{dictionary['common']?.nodot}</TableCell>
                                        <TableCell>{dictionary['common']?.key}</TableCell>
                                        {items.map(lang => (
                                            <TableCell key={lang.language}>{nameMap[lang.language]}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredKeys.map((k, idx) => (
                                        <MemoRow
                                            key={k}
                                            idx={idx}
                                            keyPath={k}
                                            langs={langs}
                                            getValue={getValue}
                                            selected={editing?.key === k}
                                            editingLang={editing?.lang || ''}
                                            startEdit={startEdit}
                                            cancelEdit={cancelEdit}
                                            saveCell={saveCell}
                                            isChanged={isChanged}
                                            isUnchangedEdited={isUnchangedEdited}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* PhÃ¢n trang â€” Ä‘áº·t DÆ¯á»šI báº£ng */}
                        {totalItems > 0 && (
                            <Box mt={5}>
                                <PaginationPage
                                    page={page}                    // 1-based cho UI
                                    pageSize={rowsPerPage}
                                    totalResults={totalItems}
                                    jumpPage={jumpPage}
                                    handlePageChange={handlePageChange}             // (e, value) => void
                                    handlePageSizeChange={handlePageSizeChange}     // (event) => void
                                    handleJumpPage={handleJumpPage}                 // (event) => void
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </ContentWrapper>
    );
}


