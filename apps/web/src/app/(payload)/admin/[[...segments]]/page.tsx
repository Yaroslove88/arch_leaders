/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

// #region agent log
fetch('http://127.0.0.1:7243/ingest/c0326067-9caf-4823-b221-37edfa52cbb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(payload)/admin/page.tsx:21',message:'PAYLOAD_ADMIN_LOADED',data:{route:'/admin',component:'PayloadRootPage'},timestamp:Date.now(),sessionId:'debug-session',runId:'route-check',hypothesisId:'A'})}).catch(()=>{});
// #endregion

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, importMap, params, searchParams })

export default Page
