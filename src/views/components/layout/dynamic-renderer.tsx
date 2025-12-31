'use client'

import ActionButtonGroup from '@/components/ActionButtonGroup'
import LoadingSubmit from '@/components/LoadingSubmit'
import Spinner from '@/components/spinners'
import { systemServiceApi } from '@/servers/system-service'
import { FormInfo, PageContentProps } from '@/types'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'
import * as Icons from '@mui/icons-material'
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic'
import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import ViewImageItem from '../ViewImageItem'
import ViewLabelItem from '../ViewLabelItem'
import ContentWrapper from './content-wrapper'
import ViewAreaItem from '../ViewAreaItem'
import ViewCheckBoxItem from '../ViewCheckBoxItem'
import ViewTableDynamicItem from '../ViewTableDynamicItem'
import ViewPostingItem from '../ViewPostingItem'
import ViewTableItem from '../ViewTableItem'
import ViewBannerItem from '../ViewBannerItem'
import ViewLabelBannerItem from '../ViewLabelBannerItem'

const DynamicRenderer = ({ dictionary, formdata, id, locale, session }: PageContentProps) => {
    const layouts = formdata?.form_design_detail?.list_layout ?? []
    const info = formdata?.form_design_detail?.info as FormInfo ?? {}
    const [loading, setLoading] = useState(false)
    const [shouldBlink, setShouldBlink] = useState(false)
    const [blinkCount, setBlinkCount] = useState(0)
    const blinkTimer = useRef<NodeJS.Timeout | null>(null)

    const { handleSubmit, setValue, getValues, formState, control } = useForm()
    const { dirtyFields } = formState
    const renderInputItem = (
        input: any,
        dictionary: Awaited<ReturnType<typeof getDictionary>>,
        isDirtyField?: boolean
    ) => {
        const DynamicIcon = input.icon && (Icons as any)[input.icon] ? (Icons as any)[input.icon] : Icons.CheckCircle;

        switch (input.inputtype) {
            case 'cLabel':
            case 'cText':
                return (
                    <ViewLabelItem
                        input={input}
                        dictionary={dictionary}
                        onChangeValue={(code, value) => setValue(code, value, { shouldDirty: true })}
                        session={session}
                        locale={locale}
                        isDirtyField={isDirtyField}
                        control={control}
                        getValues={getValues}
                    />
                )
            case 'cImage':
                return (
                    <ViewImageItem
                        input={input}
                        onChangeValue={(code, value) => setValue(code, value, { shouldDirty: true })}
                        dictionary={dictionary}
                        session={session}
                    />
                )
            case 'cLabelBanner':
                return (
                    <ViewLabelBannerItem
                        input={input}
                        dictionary={dictionary}
                        onChangeValue={(code, value) => setValue(code, value, { shouldDirty: true })}
                        session={session}
                        locale={locale}
                        isDirtyField={isDirtyField}
                        control={control}
                        getValues={getValues}
                    />
                )
            case 'cBanner':
                return (
                    <ViewBannerItem
                        input={input}
                        //onChangeValue={(code, value) => setValue(code, value, { shouldDirty: true })}
                        onChangeValue={(bannerId) => {
                            const index = input.value.findIndex((b: any) => b.id.toString() === bannerId);
                            if (index === -1) return;

                            const updatedList = input.value.map((b: any, i: number) => ({
                                ...b,
                                isdefault: i === index ? "true" : "false"
                            }));
                            setValue(input.default?.code, updatedList, { shouldDirty: true });
                            //Lấy banner đang isdefault true
                            const currentBanner = updatedList.find((b: any) => b.isdefault === "true");
                            if (!currentBanner) return;

                            // SetValue cho các field khác trong form dựa trên thuộc tính của banner
                            Object.keys(currentBanner).forEach((key) => {
                                if (key === "isdefault") return; // bỏ qua isdefault
                                setValue(key, currentBanner[key], { shouldDirty: false });
                            });
                            // setValue("channel", bannerId, { shouldDirty: false});
                        }}

                        dictionary={dictionary}
                        session={session}
                    />
                )
            case 'cTextArea':
                return (
                    <ViewAreaItem
                        input={input}
                        dictionary={dictionary}
                        session={session}
                        locale={locale}
                        control={control}
                    />
                )
            case 'cButton':
                return (
                    <Button
                        type="button"
                        variant={input.variant || 'contained'}
                        color={input.color || 'primary'}
                        startIcon={DynamicIcon ? <DynamicIcon /> : undefined}
                        onClick={() => {
                            SwalAlert('question', `${dictionary['common'].areyousureprocess}`, 'center', false, true, true, () => {
                                switch (input.btntype) {
                                    case 'submit':
                                        handleSubmit((formValues) => handleDynamicSubmit(input, formValues))()
                                        break
                                    case 'approve':
                                        handleApprove()
                                        break
                                    case 'reject':
                                        handleReject()
                                        break
                                }
                            })
                        }}
                        disabled={input?.ishidden && input.btntype === 'submit' && !formState.isDirty}
                    >
                        {input.default?.name || input.label || dictionary['common'].confirm}
                    </Button>

                )
            case 'cCheckbox':
                return (
                    <ViewCheckBoxItem
                        input={input}
                        session={session}
                        locale={locale}
                        control={control}
                        getValues={getValues}
                        setValue={setValue}
                        onChangeValue={(code, value) => setValue(code, value, { shouldDirty: true })}
                    />
                )

            case 'cTableDynamic':
                return (
                    <ViewTableDynamicItem
                        input={input}
                        control={control}
                        dictionary={dictionary}
                        setValue={setValue}
                    />
                )
            case 'cPosting':
                return (
                    <ViewPostingItem
                        input={input}
                        control={control}
                        dictionary={dictionary}
                        setValue={setValue}
                    />
                )
            case 'cTableSearch':
                return (
                    <ViewTableItem
                        input={input}
                        control={control}
                        dictionary={dictionary}
                        setValue={setValue}
                    />
                )
            default:
                return null
        }
    }

    const handleApprove = () => {
        setLoading(true)
        // TODO: handle approve logic
        console.log('Approve clicked')
        setLoading(false)
    }

    const handleReject = () => {
        setLoading(true)
        // TODO: handle reject logic
        console.log('Reject clicked')
        setLoading(false)
    }

    const handleDynamicSubmit = async (input: any, formValues: any) => {
        setLoading(true)
        try {
            const txFo = input.config?.txFo
            if (!txFo) return

            const tx = JSON.parse(txFo)
            const bo = tx.bo?.[0]
            if (!bo) return

            const allInputs = layouts
                .flatMap(layout => layout.list_view)
                .flatMap(view => view.list_input)


            let updatedFields: Record<string, any> = {}

            if (bo.input.fields && Object.keys(bo.input.fields).length > 0) {
                for (const key of Object.keys(bo.input.fields)) {
                    const field = allInputs.find(f => f.default?.code === key)
                    const value = field?.value
                    updatedFields[key] = value
                }
            } else {
                // Duyệt toàn bộ field để xử lý theo loại
                for (const field of allInputs) {
                    const code = field.default?.code
                    if (!code) continue

                    const original = field.value
                    const current = formValues[code]

                    if (field.inputtype === 'cTableDynamic' && Array.isArray(current) && Array.isArray(original)) {
                        const toKey = (v: any) => v?.configKey?.toString().trim().toLowerCase()
                        const originalByKey = new Map(original.map((o: any) => [toKey(o), o]))

                        const toDelete = current
                            .filter((row: any) => row?.isdeleted && row?.configKey)
                            .map((row: any) => ({
                                configKey: row.configKey,
                                action: 'delete'
                            }))

                        const toUpsert = current
                            .filter((row: any) => !row?.isdeleted)
                            .filter((row: any) => {
                                const key = toKey(row)
                                const o = originalByKey.get(key)
                                if (!o) return true
                                return (
                                    (row.configValue ?? '').trim() !== (o.configValue ?? '').trim() ||
                                    (row.description ?? '').trim() !== (o.description ?? '').trim() ||
                                    !!row.isactive !== !!o.isactive
                                )
                            })
                            .map((row: any) => ({
                                ...row,
                                action: 'upsert'
                            }))

                        const changedRows = [...toUpsert, ...toDelete]
                        if (changedRows.length > 0) {
                            updatedFields[code] = changedRows
                        }

                        continue
                    }


                    if (field.iskey && code && typeof field.value !== 'undefined') {
                        if (field.isBanner === true)
                        {
                            updatedFields[code] = current ?? field.value
                        }
                        else
                        {
                            updatedFields[code] = field.value
                        }
                    }
                    else if (typeof current !== 'undefined') {
                        updatedFields[code] = current
                    }
                }
            }

            const payload = {
                ...bo.input,
                fields: updatedFields
            }

            const txFoDynamic = {
                bo: [{ ...bo, input: payload }]
            }
            const submitApi = await systemServiceApi.runDynamic({
                sessiontoken: session?.user?.token,
                body: txFoDynamic
            })

            if (
                !isValidResponse(submitApi) ||
                (submitApi.payload.dataresponse.error && submitApi.payload.dataresponse.error.length > 0)
            ) {
                const errorString =
                    'ExecutionID:' + submitApi.payload.dataresponse.error[0].execute_id + ' - ' +
                    submitApi.payload.dataresponse.error[0].info
                return <Spinner />
            }

            const data = submitApi.payload.dataresponse.fo[0].input
            const changeField = (data.changed_fields ?? []).map((f: string) => f.toLowerCase())

            const successKeyByCode: Record<string, keyof typeof dictionary['common']> = {
                resetpassword: 'updateresetpasswordsuccess',
                modifyuser: 'updateinfosuccess',
            };
            const actionCode = (input?.default?.code ?? '').toLowerCase();
            const successKey =
                successKeyByCode[actionCode] ?? 'updateinfosuccess';
            for (const field of allInputs) {
                if (changeField.includes(field.default?.code)) {
                    field.isChangedField = true
                }
            }

            SwalAlert(
                'success',
                dictionary['common'][successKey],
                'center',
                false,
                false,
                true,
                () => {
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 300)
                    setBlinkCount(0)
                    setShouldBlink(true)
                },
                'OK'
            )

        } catch (error) {
            console.error('Submit error:', error)
        } finally {
            //setLoading(false)
        }
    }


    useEffect(() => {
        if (shouldBlink && blinkCount < 6) {
            blinkTimer.current = setTimeout(() => {
                setBlinkCount(prev => prev + 1)
            }, 300)
        }

        if (shouldBlink && blinkCount >= 6) {
            location.reload()
        }

        return () => {
            if (blinkTimer.current) clearTimeout(blinkTimer.current)
        }
    }, [shouldBlink, blinkCount])


    return (

        <Box className="relative">
            {loading && <LoadingSubmit loadingtext={dictionary['common'].loading} />}
            <ContentWrapper
                title={`${info?.lang_form[locale]} - ${dictionary['common'].view}`}
                description={info.des[locale] || ''}
                icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 40, color: '#225087' }} />}
                dataref={id}
                dictionary={dictionary}
            >
                <form>
                    <Box sx={{ mt: 2, width: '100%', opacity: blinkCount % 2 === 1 ? 0.3 : 1, transition: 'opacity 0.2s' }} className="mx-auto">
                        {layouts.map((layout: any, layoutIndex: number) =>
                            layout.list_view?.map((view: any, viewIndex: number) => {
                                const isActionView = view.type === 'action'
                                if (isActionView) {
                                    return (
                                        <Box
                                            key={`layout-${layoutIndex}-view-${viewIndex}`}
                                            sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}
                                        >
                                            {view.list_input?.map((input: any, inputIndex: number) => {
                                                return (
                                                    <Box key={`action-input-${inputIndex}`} sx={{ ml: 2 }}>
                                                        {renderInputItem(input, dictionary)}
                                                    </Box>
                                                )
                                            })}
                                        </Box>
                                    )
                                }
                                return (
                                    <Card
                                        className="shadow-md"
                                        sx={{ mb: 4, borderRadius: 2 }}
                                        key={`layout-${layoutIndex}-view-${viewIndex}`}
                                    >
                                        <Box
                                            sx={{
                                                bgcolor: '#225087',
                                                color: 'white',
                                                px: 3,
                                                py: 1.5,
                                                borderTopLeftRadius: 8,
                                                borderTopRightRadius: 8
                                            }}
                                        >
                                            <Typography variant="h6" color="white">
                                                {view.name || `Section ${viewIndex + 1}`}
                                            </Typography>
                                        </Box>

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
                                                            {renderInputItem(
                                                                input,
                                                                dictionary,
                                                                dirtyFields?.[input?.default?.code]
                                                            )}
                                                        </Grid>
                                                    )
                                                })}
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                )
                            }
                            )
                        )}

                        {layouts.some(layout => layout.haveauthen === true) && (
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
    )
}

export default DynamicRenderer
