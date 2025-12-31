// Next Imports
import { NextResponse } from 'next/server';

import type { UserTable } from './users';
import { env } from '@/env.mjs';
import { WORKFLOWCODE } from '@/data/WorkflowCode';

type ResponseUser = Omit<UserTable, 'password'>

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function POST(req: Request) {
  // Vars
  const { username, password } = await req.json()

  const my_device = JSON.stringify(req.headers.get('my_device')) || '{}'

  const headerrequest = {
    'content-type': 'application/json',
    'lang': req.headers.get('lang') || 'en',
    'app': req.headers.get('app') || 'SYS',
    'my_device': JSON.parse(my_device),
    'uid': ""
  }

  const bodyrequest = JSON.stringify({
    workflowid: WORKFLOWCODE.WF_BO_LOGIN,
    fields: {
      login_name: username,
      password: password,
    },
  })

  const requestDetails = {
    method: 'POST',
    headers: headerrequest,
    body: bodyrequest,
  };

  const endpoint = `${env.NEXT_PUBLIC_REST_API_ENDPOINT}`
  const requestLogin = await fetch(endpoint, requestDetails);
  let response: null | ResponseUser = null
  if (requestLogin.status === 200) {
    const dataresponse = await requestLogin.json()
    if (dataresponse.errors.length === 0) {
      response = dataresponse.data
      return NextResponse.json(response)
    } else {
      const errormsg = dataresponse.errors[0].info
      const keyerror = dataresponse.errors[0].key
      const errorcode = dataresponse.errors[0].code
      if (keyerror === '500') {
        return NextResponse.json(
          {
            message: "❌ The server is temporarily unavailable. Please try again later!",
            error: errormsg
          },
          {
            status: 500,
            statusText: errormsg
          }
        );
      }

      if (errorcode === 'HAVELOGGED') {
        return NextResponse.json(
          {
            message: errormsg,
            error: errorcode
          },
          {
            status: 299,
            statusText: 'HAVELOGGED'
          }
        );
      }

      return NextResponse.json(
        {
          message: errormsg,
          error: errormsg
        },
        {
          status: 401,
          statusText: errormsg
        }
      )
    }

  } else if (requestLogin.status === 404) {
    return NextResponse.json(
      {
        message: "The link URI not found!. The server is temporarily down. Please try again later!"
      },
      { status: 404 });
  }

  else {
    return NextResponse.json(
      {
        message: "❌ The server is temporarily unavailable. Please try again later!"
      },
      { status: 500 });
  }

}
