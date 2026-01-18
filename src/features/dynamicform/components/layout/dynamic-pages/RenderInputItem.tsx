'use client';

import { PageContentProps } from '@/types';
import { getDictionary } from '@/utils/getDictionary';
import * as Icons from '@mui/icons-material';
import { Button } from '@mui/material';

import ViewImageItem from '../../../../../views/components/ViewImageItem';
import ViewLabelItem from '../../../../../views/components/ViewLabelItem';
import ViewAreaItem from '../../../../../views/components/ViewAreaItem';
import ViewCheckBoxItem from '../../../../../views/components/ViewCheckBoxItem';
import ViewTableDynamicItem from '../../../../../views/components/ViewTableDynamicItem';
import ViewPostingItem from '../../../../../views/components/ViewPostingItem';
import ViewTableItem from '../../../../../views/components/ViewTableItem';
import ViewBannerItem from '../../../../../views/components/ViewBannerItem';
import ViewLabelBannerItem from '../../../../../views/components/ViewLabelBannerItem';

// ============================================================================
// Types
// ============================================================================

export interface RenderInputItemProps {
  input: any;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  isDirtyField?: boolean;
  session: PageContentProps['session'];
  locale: PageContentProps['locale'];
  control: any;
  getValues: any;
  onChangeValue: (code: string, value: any) => void;
  onChangeBanner: (input: any, bannerId: string) => void;
  handleFormSubmit: (input: any) => void;
  isFormDirty: boolean;
}

// ============================================================================
// Component
// ============================================================================

const RenderInputItem = ({
  input,
  dictionary,
  isDirtyField,
  session,
  locale,
  control,
  getValues,
  onChangeValue,
  onChangeBanner,
  handleFormSubmit,
  isFormDirty,
}: RenderInputItemProps) => {
  const DynamicIcon =
    input.icon && (Icons as any)[input.icon]
      ? (Icons as any)[input.icon]
      : Icons.CheckCircle;

  switch (input.inputtype) {
    case 'cLabel':
    case 'cText':
      return (
        <ViewLabelItem
          input={input}
          dictionary={dictionary}
          onChangeValue={onChangeValue}
          session={session}
          locale={locale}
          isDirtyField={isDirtyField}
          control={control}
          getValues={getValues}
        />
      );

    case 'cImage':
      return (
        <ViewImageItem
          input={input}
          onChangeValue={onChangeValue}
          dictionary={dictionary}
          session={session}
        />
      );

    case 'cLabelBanner':
      return (
        <ViewLabelBannerItem
          input={input}
          dictionary={dictionary}
          onChangeValue={onChangeValue}
          session={session}
          locale={locale}
          isDirtyField={isDirtyField}
          control={control}
          getValues={getValues}
        />
      );

    case 'cBanner':
      return (
        <ViewBannerItem
          input={input}
          onChangeValue={(bannerId) => onChangeBanner(input, bannerId)}
          dictionary={dictionary}
          session={session}
        />
      );

    case 'cTextArea':
      return (
        <ViewAreaItem
          input={input}
          dictionary={dictionary}
          session={session}
          locale={locale}
          control={control}
        />
      );

    case 'cButton':
      return (
        <Button
          type="button"
          variant={input.variant || 'contained'}
          color={input.color || 'primary'}
          startIcon={DynamicIcon ? <DynamicIcon /> : undefined}
          onClick={() => handleFormSubmit(input)}
          disabled={input?.ishidden && input.btntype === 'submit' && !isFormDirty}
        >
          {input.default?.name || input.label || dictionary['common'].confirm}
        </Button>
      );

    case 'cCheckbox':
      return (
        <ViewCheckBoxItem
          input={input}
          session={session}
          locale={locale}
          control={control}
          getValues={getValues}
          setValue={(code: string, value: any) => onChangeValue(code, value)}
          onChangeValue={onChangeValue}
        />
      );

    case 'cTableDynamic':
      return (
        <ViewTableDynamicItem
          input={input}
          control={control}
          dictionary={dictionary}
          setValue={(code: string, value: any) => onChangeValue(code, value)}
        />
      );

    case 'cPosting':
      return (
        <ViewPostingItem
          input={input}
          control={control}
          dictionary={dictionary}
          session={session}
        />
      );

    case 'cTableSearch':
      return (
        <ViewTableItem
          input={input}
          control={control}
          dictionary={dictionary}
          setValue={(code: string, value: any) => onChangeValue(code, value)}
        />
      );

    default:
      return null;
  }
};

export default RenderInputItem;
