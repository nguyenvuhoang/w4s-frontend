export const isHidden = (roleTasks: any, id: string): boolean => {
    if (roleTasks?.['2']?.[id]?.component) {
        return roleTasks['2'][id].component.install === false;
    }
    return true;
};
