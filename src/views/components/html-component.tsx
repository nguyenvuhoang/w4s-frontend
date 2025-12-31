'use client'

import { NoSsr } from "@mui/material";


const HTMLComponent = ({ filename }: { filename: string }) => {

    return (
        <NoSsr>
            <div>
                <div
                    dangerouslySetInnerHTML={{ __html: filename }}
                />
            </div>
        </NoSsr>
    );
};
export default HTMLComponent;
