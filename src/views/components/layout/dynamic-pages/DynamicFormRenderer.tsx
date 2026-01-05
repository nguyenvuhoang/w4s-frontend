'use client';

import ActionButtonGroup from '@/components/ActionButtonGroup';
import LoadingSubmit from '@/components/LoadingSubmit';
import { PageContentProps } from '@/types';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

import ContentWrapper from '../content-wrapper';
import { useDynamicRenderer } from '../hooks/useDynamicRenderer';
import RenderInputItem from './RenderInputItem';

// ============================================================================
// Dynamic Form Renderer Component
// ============================================================================

const DynamicFormRenderer = ({
  dictionary,
  formdata,
  id,
  locale,
  session,
}: PageContentProps) => {
  const {
    formMethods,
    dirtyFields,
    layouts,
    info,
    loading,
    blinkCount,
    hasAuthentication,
    handleApprove,
    handleReject,
    handleFormSubmit,
    onChangeValue,
    onChangeBanner,
  } = useDynamicRenderer({
    formdata,
    session,
    dictionary,
    locale,
  });

  const { control, getValues, formState } = formMethods;

  return (
    <Box className="relative">
      {loading && (
        <LoadingSubmit loadingtext={dictionary['common'].loading} />
      )}

      <ContentWrapper
        title={`${info?.lang_form?.[locale] ?? ''} - ${dictionary['common'].view}`}
        description={((info as any).des as Record<string, string>)?.[locale] || ''}
        icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 40, color: '#225087' }} />}
        dataref={id}
        dictionary={dictionary}
      >
        <form>
          <Box
            sx={{
              mt: 2,
              width: '100%',
              opacity: blinkCount % 2 === 1 ? 0.3 : 1,
              transition: 'opacity 0.2s',
            }}
            className="mx-auto"
          >
            {layouts.map((layout: any, layoutIndex: number) =>
              layout.list_view?.map((view: any, viewIndex: number) => {
                const isActionView = view.type === 'action';

                // Action View
                if (isActionView) {
                  return (
                    <Box
                      key={`layout-${layoutIndex}-view-${viewIndex}`}
                      sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}
                    >
                      {view.list_input?.map((input: any, inputIndex: number) => (
                        <Box key={`action-input-${inputIndex}`} sx={{ ml: 2 }}>
                          <RenderInputItem
                            input={input}
                            dictionary={dictionary}
                            session={session}
                            locale={locale}
                            control={control}
                            getValues={getValues}
                            onChangeValue={onChangeValue}
                            onChangeBanner={onChangeBanner}
                            handleFormSubmit={handleFormSubmit}
                            isFormDirty={formState.isDirty}
                          />
                        </Box>
                      ))}
                    </Box>
                  );
                }

                // Content Card View
                return (
                  <Card
                    className="shadow-md"
                    sx={{ mb: 4, borderRadius: 2 }}
                    key={`layout-${layoutIndex}-view-${viewIndex}`}
                  >
                    {/* Card Header */}
                    <Box
                      sx={{
                        bgcolor: '#225087',
                        color: 'white',
                        px: 3,
                        py: 1.5,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                      }}
                    >
                      <Typography variant="h6" color="white">
                        {view.name || `Section ${viewIndex + 1}`}
                      </Typography>
                    </Box>

                    {/* Card Content */}
                    <CardContent>
                      <Grid container spacing={5}>
                        {view.list_input?.map((input: any, inputIndex: number) => {
                          if (input.ishidden) return null;
                          return (
                            <Grid
                              size={{ ...(input.size ?? { xs: 12, md: 6 }) }}
                              key={`input-${inputIndex}`}
                              sx={{ px: 5 }}
                            >
                              <RenderInputItem
                                input={input}
                                dictionary={dictionary}
                                isDirtyField={dirtyFields?.[input?.default?.code]}
                                session={session}
                                locale={locale}
                                control={control}
                                getValues={getValues}
                                onChangeValue={onChangeValue}
                                onChangeBanner={onChangeBanner}
                                handleFormSubmit={handleFormSubmit}
                                isFormDirty={formState.isDirty}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Authentication Action Buttons */}
            {hasAuthentication && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <ActionButtonGroup
                  onApprove={handleApprove}
                  onReject={handleReject}
                  loading={loading}
                  approveLabel={dictionary['common'].approve}
                  rejectLabel={dictionary['common'].reject}
                />
              </Box>
            )}
          </Box>
        </form>
      </ContentWrapper>
    </Box>
  );
};

export default DynamicFormRenderer;
