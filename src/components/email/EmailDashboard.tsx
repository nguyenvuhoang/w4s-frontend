'use client';

import ComposeEmailModal from '@/components/email/ComposeEmailModal';
import EmailSettingsView from '@/components/email/EmailSettingsView';
import EmailSidebar from '@/components/email/EmailSidebar';
import {
    DeleteOutline as DeleteIcon,
    ArrowDropDown as DropDownIcon,
    MoreVert as MoreIcon,
    Refresh as RefreshIcon,
    SettingsOutlined as SettingsIcon
} from '@mui/icons-material';
import {
    Box,
    Checkbox,
    IconButton,
    Pagination,
    Stack,
    Typography
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import EmailListRow from '@/components/email/EmailListRow';
import EmailDetailView from '@/components/email/EmailDetailView';
import { useEmailDeleteHandler } from '@/features/email/hooks/useEmailDeleteHandler';
import { useEmailSelectionHandler } from '@/features/email/hooks/useEmailSelectionHandler';
import { useEmailDetailHandler } from '@/features/email/hooks/useEmailDetailHandler';
import { useEmailStarHandler } from '@/features/email/hooks/useEmailStarHandler';
import { useEmailImportantHandler } from '@/features/email/hooks/useEmailImportantHandler';
import { Session } from 'next-auth';

interface EmailDashboardProps {
    headerContent: React.ReactNode;
    initialEmails?: any[];
    totalCount?: number;
    totalPages?: number;
    currentPage?: number;
    pageSize?: number;
    dictionary: any;
    locale: string;
    session: Session | null;
}

export default function EmailDashboard({
    headerContent,
    initialEmails = [],
    totalCount = 0,
    totalPages = 1,
    currentPage = 1,
    pageSize = 10,
    dictionary,
    locale,
    session
}: EmailDashboardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'list' | 'settings'>('list');
    const [emails, setEmails] = useState<any[]>(initialEmails);
    const {
        selectedIds,
        isAllSelected,
        isSomeSelected,
        toggleSelectAll,
        toggleSelect,
        isSelected,
        clearSelection,
        getEmailId
    } = useEmailSelectionHandler(emails);

    const { handleDelete, deleting } = useEmailDeleteHandler(() => {
        clearSelection();
    });

    const {
        emailDetail,
        loading: detailLoading,
        handleViewDetail,
        handleBackToList
    } = useEmailDetailHandler(session?.user?.token || '');

    const onDeleteClick = () => {
        handleDelete(Array.from(selectedIds));
    };

    const { handleToggleStar } = useEmailStarHandler();

    const handleStarClick = async (emailId: string | number) => {
        // Optimistic update
        setEmails(prev => prev.map(e => {
            if (getEmailId(e) === emailId) {
                return { ...e, is_star: !e.is_star };
            }
            return e;
        }));

        const success = await handleToggleStar(emailId);

        // Revert if failed
        if (!success) {
            setEmails(prev => prev.map(e => {
                if (getEmailId(e) === emailId) {
                    return { ...e, is_star: !e.is_star };
                }
                return e;
            }));
        }
    };

    const { handleToggleImportant } = useEmailImportantHandler();

    const handleImportantClick = async (emailId: string | number) => {
        // Optimistic update
        setEmails(prev => prev.map(e => {
            if (getEmailId(e) === emailId) {
                return { ...e, is_important: !e.is_important };
            }
            return e;
        }));

        const success = await handleToggleImportant(emailId);

        // Revert if failed
        if (!success) {
            setEmails(prev => prev.map(e => {
                if (getEmailId(e) === emailId) {
                    return { ...e, is_important: !e.is_important };
                }
                return e;
            }));
        }
    };

    // Update emails if initialEmails changes (e.g. from server refetch)
    React.useEffect(() => {
        setEmails(initialEmails);
    }, [initialEmails]);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        handlePageChange(newPage + 1);
    };

    const handleMuiPaginationChange = (event: React.ChangeEvent<unknown>, value: number) => {
        handlePageChange(value);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const params = new URLSearchParams(window.location.search);
        params.set('size', event.target.value);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, totalCount);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            overflow: 'hidden'
        }}>
            {/* Header Shell - Passed from Server for optimization */}
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                {headerContent}

                {/* Interactive Header Action */}
                <Stack direction="row" spacing={1}>
                    <IconButton
                        sx={{
                            color: currentView === 'settings' ? 'primary.main' : 'text.secondary',
                            bgcolor: currentView === 'settings' ? 'action.selected' : 'transparent'
                        }}
                        onClick={() => setCurrentView('settings')}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Stack>
            </Box>

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <EmailSidebar
                    onCompose={() => setIsComposeOpen(true)}
                    totalCount={totalCount}
                    dictionary={dictionary}
                    locale={locale}
                />

                {/* Main Content Area */}
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    borderRadius: '16px 0 0 0',
                    overflow: 'hidden',
                    borderLeft: '1px solid',
                    borderColor: 'divider'
                }}>
                    {currentView === 'list' ? (
                        emailDetail ? (
                            <EmailDetailView
                                email={emailDetail}
                                onBack={handleBackToList}
                                onDelete={() => {
                                    const emailId = getEmailId(emailDetail);
                                    handleDelete([emailId]);
                                    handleBackToList();
                                }}
                            />
                        ) : (
                            <>
                                {/* Toolbar */}
                                <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Stack direction="row" spacing={1}>
                                        <Stack direction="row" alignItems="center">
                                            <Checkbox
                                                size="small"
                                                indeterminate={isSomeSelected}
                                                checked={isAllSelected}
                                                onChange={toggleSelectAll}
                                                sx={{ color: 'text.secondary', p: 0.5 }}
                                            />
                                            <IconButton size="small" sx={{ color: 'text.secondary' }}><DropDownIcon fontSize="small" /></IconButton>
                                        </Stack>
                                        <IconButton
                                            size="small"
                                            sx={{ color: 'text.secondary' }}
                                            onClick={() => router.refresh()}
                                        >
                                            <RefreshIcon fontSize="small" />
                                        </IconButton>

                                        {selectedIds.size > 0 && (
                                            <IconButton
                                                size="small"
                                                sx={{ color: 'text.secondary' }}
                                                onClick={onDeleteClick}
                                                disabled={deleting}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}

                                        <IconButton size="small" sx={{ color: 'text.secondary' }}><MoreIcon fontSize="small" /></IconButton>
                                    </Stack>

                                </Box>

                                {/* Tabs */}
                                <Box sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Stack direction="row">
                                        <Box sx={{
                                            px: 4, py: 1.5,
                                            borderBottom: '3px solid',
                                            borderColor: 'primary.main',
                                            display: 'flex', alignItems: 'center',
                                            color: 'primary.main'
                                        }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {dictionary.email.primary_tab}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Email Items placeholder */}
                                <Box sx={{
                                    flexGrow: 1,
                                    overflowY: 'auto',
                                    position: 'relative'
                                }}>
                                    {emails.map((email) => {
                                        const emailId = getEmailId(email);
                                        return (
                                            <EmailListRow
                                                key={emailId}
                                                email={email}
                                                selected={isSelected(emailId)}
                                                onToggleSelect={() => toggleSelect(emailId)}
                                                onClick={() => handleViewDetail(emailId)}
                                                onToggleStar={() => handleStarClick(emailId)}
                                                onToggleImportant={() => handleImportantClick(emailId)}
                                            />
                                        );
                                    })}
                                </Box>

                                {/* Unified Bottom Pagination */}
                                <Box sx={{
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    zIndex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                    px: 2,
                                    py: 1
                                }}>
                                    {/* Rows Per Page Selection */}
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {dictionary.email.rows_per_page}
                                        </Typography>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => handleChangeRowsPerPage({ target: { value: e.target.value } } as any)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'inherit',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            {[10, 25, 50, 100].map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </Stack>

                                    {/* Page Numbers */}
                                    <Pagination
                                        count={totalPages || Math.ceil(totalCount / pageSize)}
                                        page={currentPage}
                                        onChange={handleMuiPaginationChange}
                                        color="primary"
                                        size="small"
                                        sx={{
                                            '& .MuiPaginationItem-root': {
                                                color: 'text.secondary',
                                            },
                                            '& .Mui-selected': {
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                }
                                            }
                                        }}
                                    />

                                    {/* Item Range Label */}
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {dictionary.email.table_pagination_label
                                            .replace('{from}', rangeStart.toString())
                                            .replace('{to}', rangeEnd.toString())
                                            .replace('{count}', totalCount.toString())}
                                    </Typography>
                                </Box>
                            </>
                        )
                    ) : (
                        <EmailSettingsView onBack={() => setCurrentView('list')} dictionary={dictionary} />
                    )}
                </Box>
            </Box>

            {/* Compose Modal */}
            <ComposeEmailModal
                open={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                dictionary={dictionary}
            />
        </Box>
    );
}
