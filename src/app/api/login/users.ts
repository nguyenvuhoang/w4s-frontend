// ** Fake user data and data type

import { ResponseArray } from "@/types"

// ** Please remove below user data and data type in production and verify user with Real Database
export type Users = {
  txcode: string,
  input: {
    expireTime: Date,
    token: string
  }
}
export type UserTable = {
  fo: ResponseArray<Users>
}
