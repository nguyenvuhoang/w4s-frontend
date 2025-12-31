'use client'

declare global {
    interface Window {
        obManagerTemplate_libManagerTemplate: {
            managerTemplate_getComponent: (componentCode: string) => any; 
        };
    }
}

export function managerTemplate_getComponent(component_code: string): any {
    return window.obManagerTemplate_libManagerTemplate.managerTemplate_getComponent(component_code);
}
