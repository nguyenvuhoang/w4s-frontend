"use client";

import { Locale } from "@/configs/i18n";
import { getLocalizedUrl } from "@/shared/utils/i18n";
import ContentWrapper from "@features/dynamicform/components/layout/content-wrapper";
import SchemaIcon from "@mui/icons-material/Schema";
import {
    Box,
    Button,
    Step,
    StepLabel,
    Stepper,
} from "@mui/material";
import { getDictionary } from "@utils/getDictionary";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddWorkflowDefinitionForm } from "./AddWorkflowDefinitionForm";
import { AddWorkflowStepForm } from "./AddWorkflowStepForm";

interface AddWorkflowWizardProps {
    session: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    locale: Locale;
}

const steps = ["Add Workflow Definition", "Add Workflow Steps"];

export const AddWorkflowWizard = ({
    session,
    dictionary,
    locale,
}: AddWorkflowWizardProps) => {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(0);
    const [workflowId, setWorkflowId] = useState<string>("");

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleWorkflowDefinitionSuccess = (id: string) => {
        setWorkflowId(id);
        handleNext();
    };

    const handleReset = () => {
        setActiveStep(0);
        setWorkflowId("");
    };

    const handleFinish = () => {
        router.push(getLocalizedUrl("/workflow-management", locale));
    };

    return (
        <ContentWrapper
            title="Add Workflow"
            description="Create a new workflow definition and add its steps."
            icon={<SchemaIcon sx={{ fontSize: 40, color: "#225087" }} />}
            dictionary={dictionary}
        >
            <Box sx={{ width: "100%", py: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 2 }}>
                    {activeStep === 0 && (
                        <AddWorkflowDefinitionForm
                            session={session}
                            dictionary={dictionary}
                            onSuccess={handleWorkflowDefinitionSuccess}
                            hideClear
                        />
                    )}
                    {activeStep === 1 && (
                        <AddWorkflowStepForm
                            session={session}
                            dictionary={dictionary}
                            locale={locale}
                            initialWorkflowId={workflowId}
                        />
                    )}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                    <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
                        Back
                    </Button>
                    <Box>
                        {activeStep === 1 ? (
                            <Button onClick={handleFinish} variant="contained" color="primary">
                                Finish & Close
                            </Button>
                        ) : (
                            <Button onClick={handleFinish} variant="text" color="secondary">
                                Cancel
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </ContentWrapper>
    );
};
