'use client';

import { getDictionary } from '@/utils/getDictionary';
import { Box, Button, Paper, Typography } from '@mui/material';
import Image from 'next/image';

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

type Props = {
  errorinfo?: string;
  dictionary: Dictionary
  execute_id?: string;
};

export default function MenuManagementError({ errorinfo, dictionary, execute_id }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          maxWidth: 800,
          backgroundColor: '#fff',
        }}
      >
        <Image
          src="/images/illustrations/error.svg"
          width={400}
          height={300}
          alt="Error"
          priority
        />

        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2, color: '#d32f2f' }}>
          {dictionary.coresession.error_load_title}
        </Typography>

        <Typography fontFamily="Quicksand" variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          We encountered an unexpected issue. Please try again or contact support if the problem persists.
        </Typography>

        {(errorinfo || execute_id) && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: '#ffebee',
              borderRadius: 2,
              color: '#d32f2f',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {execute_id && (
              <Box sx={{ mb: 1 }}>
                <strong>{dictionary['common'].executionid}:</strong> {execute_id}
              </Box>
            )}

            {errorinfo && (
              <Box>
                <strong>{dictionary['common'].info}:</strong> {errorinfo}
              </Box>
            )}
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3, borderRadius: 2, px: 3 }}
          onClick={() => window.location.reload()}
        >
          {dictionary.common.try_again ?? 'Try Again'}
        </Button>
      </Paper>
    </Box>
  );
}
