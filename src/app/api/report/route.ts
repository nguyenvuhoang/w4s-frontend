// src/pages/api/report.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { env } from '@/env.mjs'
import { Agent as UndiciAgent, Dispatcher, fetch as undiciFetch } from 'undici'

const REPORT_BASE = env.NEXT_PUBLIC_REPORT_URI as string 
const ALLOW_INSECURE = env.ALLOW_INSECURE_REPORT_SSL === 'true'

function getDispatcher(u: URL): Dispatcher | undefined {
    if (u.protocol !== 'https:' || !ALLOW_INSECURE) return undefined
    return new UndiciAgent({ connect: { rejectUnauthorized: false, servername: u.hostname } })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const upstream = new URL(REPORT_BASE)

        for (const [k, v] of Object.entries(req.query)) {
            if (Array.isArray(v)) v.forEach(val => upstream.searchParams.append(k, String(val)))
            else upstream.searchParams.set(k, String(v))
        }

        const upstreamRes = await undiciFetch(upstream, {
            method: 'GET',
            dispatcher: getDispatcher(upstream),
            headers: {
                accept: (req.headers['accept'] as string) ?? '*/*',
            },
        })

        const buf = Buffer.from(await upstreamRes.arrayBuffer())

        res.setHeader('Cache-Control', 'no-store, max-age=0')
        const ct = upstreamRes.headers.get('content-type'); if (ct) res.setHeader('Content-Type', ct)
        const cd = upstreamRes.headers.get('content-disposition'); if (cd) res.setHeader('Content-Disposition', cd)
        const ce = upstreamRes.headers.get('content-encoding'); if (ce) res.setHeader('Content-Encoding', ce)

        res.removeHeader('X-Frame-Options')
        res.removeHeader('Content-Security-Policy')

        res.status(upstreamRes.status).send(buf)
    } catch (e) {
        console.error('Report proxy error:', e)
        res.status(502).json({ error: 'Proxy failed' })
    }
}
