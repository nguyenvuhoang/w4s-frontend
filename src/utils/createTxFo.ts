import { WORKFLOWCODE } from "@/data/WorkflowCode";

export const createTxFo = (commandname: string, textsearch?: string) => [
    {
        use_microservice: true,
        input: {
            fields: {
                commandname,
                pageindex: 1,
                pagesize: 9999,
                issearch: true,
                parameters: { searchtext: textsearch },
            },
            learn_api: 'cbs_workflow_execute',
            workflowid: WORKFLOWCODE.SYS_EXECUTE_SQL,
        },
    },
];
