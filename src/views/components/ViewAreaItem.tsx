'use client'

import JsonEditorComponent from '@/@core/components/jSONEditor';
import { Locale } from '@/configs/i18n';
import { getDictionary } from '@/utils/getDictionary';
import { Grid, NoSsr, Typography } from '@mui/material';
import { Session } from 'next-auth';
import { useMemo, useState } from 'react';
import { Control } from 'react-hook-form';
interface ViewImageItemProps {
  input: {
    value: string;
    default?: {
      name?: string;
      code?: string;
    };
    ismodify?: boolean;
  };
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  session: Session | null;
  locale: Locale
  control: Control<any>
}

const ViewAreaItem = ({ input, dictionary, session, locale, control }: ViewImageItemProps) => {

  const parseJSON = (value: any) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      console.error('Invalid JSON string:', error);
      return {};
    }
  };
  const initialJson = useMemo(() => {
    const rawValue = input.value || '{}';
    return parseJSON(rawValue);
  }, [input]);

  // Trạng thái JSON hiện tại trong editor
  const [jsonContent, setJsonContent] = useState<object>(initialJson);

  return (
    <NoSsr>
      <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px' }}>
        <Typography
          variant="subtitle1"
          sx={{ marginBottom: '8px', fontFamily: 'Quicksand' }}
        >
          {input?.default?.name}
        </Typography>
        <JsonEditorComponent
          initialJson={jsonContent}
          onChange={(updatedJson: object) => setJsonContent(updatedJson)}
        />
      </Grid>
    </NoSsr>
  );
};

export default ViewAreaItem;
