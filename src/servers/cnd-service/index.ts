import { env } from "@/env.mjs";
import { FilesDataResponse } from "@shared/types/systemTypes";
import { apiPostForm } from "../lib/api"; 

interface FileDataRequest {
    sessiontoken: string | unknown
    file: FormData
    folderUpload?: string
}

export const cdnServiceApi = {
    uploadFile: ({ sessiontoken, file, folderUpload }: FileDataRequest) =>
        apiPostForm<FilesDataResponse>(
            file,
            sessiontoken as string,
            {
                lang: "en",
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            },
            folderUpload
        ),
};

