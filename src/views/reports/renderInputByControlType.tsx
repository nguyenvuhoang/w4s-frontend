'use client'

import RenderInputDefault from "@components/reports/render-input";
import RenderSelectDefault from "@components/reports/render-select";
import { ReportParam } from "@shared/types/bankType";
import { Session } from "next-auth";
import { FieldValues, UseFormReturn } from "react-hook-form";

export const renderInputByControlType = (
    param: ReportParam,
    formMethods: UseFormReturn<FieldValues, any, undefined>,
    session: Session | null
) => {
    switch (param.controltype) {
        case 'TextBox':
            return (
                <RenderInputDefault
                    formMethods={formMethods}
                    paramname={param.paramname}
                    controlname={param.controlname}
                />
            );
        case 'DropDownList':
            return (
                <RenderSelectDefault
                    formMethods={formMethods}
                    paramname={param.paramname}
                    controlname={param.controlname}
                    ddlstore={param.ddlstore}
                    ddltext={param.ddltext}
                    ddlvalue={param.ddlvalue}
                    session={session}
                />
            );
        default:
            return null;
    }
};

