/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import React from 'react'

import { importMap } from './admin/importMap'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

// This server function is required by the RootLayout to execute admin-side logic
const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c0326067-9caf-4823-b221-37edfa52cbb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(payload)/layout.tsx:25',message:'PAYLOAD_LAYOUT_RENDERING',data:{hasConfig:!!config,hasImportMap:!!importMap},timestamp:Date.now(),sessionId:'debug-session',runId:'init-check',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}

export default Layout
