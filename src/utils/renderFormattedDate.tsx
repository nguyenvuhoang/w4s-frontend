
import { Box } from "@mui/material";

export const renderFormattedDate = (dateStr: string, locale: 'vi' | 'en' | 'la') => {
    if (!dateStr) return '--';
  
    const [year, month, day] = dateStr.split('-'); // YYYY-MM-DD
  
    if (locale === 'vi') {
      return (
        <>
          Ngày{' '}
          <Box component="span" fontWeight="bold">{day}</Box>{' '}tháng{' '}
          <Box component="span" fontWeight="bold">{month}</Box>{' '}năm{' '}
          <Box component="span" fontWeight="bold">{year}</Box>
        </>
      );
    }
  
    if (locale === 'en') {
      return (
        <Box component="span" fontWeight="bold">
          {`${day}/${month}/${year}`}
        </Box>
      );
    }
  
    if (locale === 'la') {
      return (
        <>
          ວັນທີ{' '}
          <Box component="span" fontWeight="bold">{day}</Box>{' '}ເດືອນ{' '}
          <Box component="span" fontWeight="bold">{month}</Box>{' '}ປີ{' '}
          <Box component="span" fontWeight="bold">{year}</Box>
        </>
      );
    }
  
    return dateStr;
  };
  
