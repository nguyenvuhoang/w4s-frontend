import z from 'zod'

export const LoginRes = z.object({
    response_data: z.object({
        token: z.string(),
        expiresAt: z.string(),
        account: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string()
        })
    }),
    message: z.string()
})

export const RegisterRes = z.object({
    status: z.string(),
    message: z.string(),
    error_name: z.string(),
    error_description: z.string(),
    lang: z.string(),
    response_data: z.object({

    })
})

export const RegisterBody = z
    .object({
        email: z.string().email(),
        password: z.string().min(6).max(100)
    })
    .strict()

export const LoginBody = z.object(
    {
        email: z.string().email(),
        password: z.string().min(6).max(100)
    }
).strict()

export const VerifyBody = z
    .object({
        email: z.string().email(),
        transcode: z.string(),
        token_verify: z.string()
    })
    .strict()



export const ResetPasswordBody = z
    .object({
        newpassword: z.string().min(8, { message: "Password is too short" }).max(20, { message: "Password is too long" }),
        confirmnewpassword: z.string()
    })
    .refine((data) => data.newpassword === data.confirmnewpassword, {
        message: "Passwords do not match",
        path: ["confirmnewpassword"], // path of error
    });

export const RequestResetPasswordBody = z
    .object({
        email: z.string().email()
    })

export const UserProfile = z.object({
    phone: z.string().min(1).max(12),
    email: z.string().email(),
    national_id: z.string().min(1).max(12),
})

export type LoginResType = z.TypeOf<typeof LoginRes>
export type LoginBodyType = z.TypeOf<typeof LoginBody>

export type RegisterBodyType = z.TypeOf<typeof RegisterBody>
export type RegisterResType = z.TypeOf<typeof RegisterRes>
export type VerifyBodyType = z.TypeOf<typeof VerifyBody>

export type ResetpasswordBodyType = z.TypeOf<typeof ResetPasswordBody>


export type RequestResetpasswordBodyType = z.TypeOf<typeof RequestResetPasswordBody>




