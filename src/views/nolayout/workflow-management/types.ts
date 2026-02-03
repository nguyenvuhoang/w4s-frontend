export type WorkflowDefinitionType = {
    WorkflowId: string;
    WorkflowName: string;
    Description: string;
    ChannelId: string;
    Status: boolean;
    IsReverse: boolean;
    Timeout: number;
    TemplateResponse: string;
    WorkflowEvent: string;
};

export type WorkflowStepType = {
    WorkflowId: string;
    StepOrder: number;
    StepCode: string;
    ServiceId: string;
    Status: boolean;
    Description: string;
    SendingTemplate: Record<string, any>;
    SubSendingTemplate: Record<string, any>;
    MappingResponse: Record<string, any>;
    StepTimeout: number;
    SendingCondition: Record<string, any>;
    ProcessingNumber: number;
    IsReverse: boolean;
    ShouldAwaitStep: boolean;
};

export const wfDefKeyMap: Record<string, keyof WorkflowDefinitionType> = {
    workflow_id: "WorkflowId",
    workflow_name: "WorkflowName",
    description: "Description",
    channel_id: "ChannelId",
    status: "Status",
    is_reverse: "IsReverse",
    timeout: "Timeout",
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
    sub_sending_template: "SubSendingTemplate",
    mapping_response: "MappingResponse",
    step_timeout: "StepTimeout",
    sending_condition: "SendingCondition",
    processing_number: "ProcessingNumber",
    is_reverse: "IsReverse",
    should_await_step: "ShouldAwaitStep",
};
