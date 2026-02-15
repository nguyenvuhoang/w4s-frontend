export const formatDateTime = (dateString: string | number | null | undefined): string => {
    if (!dateString) return '';

    let date: Date;

    // Handle numeric timestamp passed as string
    if (typeof dateString === 'string' && !isNaN(Number(dateString)) && !dateString.includes('-') && !dateString.includes(':')) {
        date = new Date(Number(dateString));
    } else {
        date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
        return '';
    }

    // Add 7 hours (Manual Timezone Adjustment?)
    // Note: Ideally use .toLocaleString('en-US', { timeZone: '...' }) instead of manual manipulation
    date.setHours(date.getHours() + 7);

    const pad = (num: number) => num.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
