export type WorkflowDefinitionType = {
    WorkflowId: string;
    WorkflowName: string;
    Description: string;
    ChannelId: string;
    Status: string;
    TemplateResponse: string;
    WorkflowEvent: string;
    workflow_id: string;
    workflow_name: string;
    description: string;
    channel_id: string;
    status: string;
    template_response: string;
    workflow_event: string;
};

export type WorkflowStepType = {
    WorkflowId: string;
    StepOrder: number;
    StepCode: string;
    ServiceId: string;
    Status: string;
    Description: string;
    SendingTemplate: Record<string, any>;
    MappingResponse: Record<string, any>;
    SendingCondition: Record<string, any>;
    ProcessingNumber: number;
};

export const wfDefKeyMap: Record<string, keyof WorkflowDefinitionType> = {
    workflow_id: "WorkflowId",
    workflow_name: "WorkflowName",
    description: "Description",
    channel_id: "ChannelId",
    status: "Status",
    template_response: "TemplateResponse",
    workflow_event: "WorkflowEvent",
};

export const wfStepKeyMap: Record<string, keyof WorkflowStepType> = {
    workflow_id: "WorkflowId",
    step_order: "StepOrder",
    step_code: "StepCode",
    service_id: "ServiceId",
    status: "Status",
    description: "Description",
    sending_template: "SendingTemplate",
    mapping_response: "MappingResponse",
    sending_condition: "SendingCondition",
    processing_number: "ProcessingNumber",
};
