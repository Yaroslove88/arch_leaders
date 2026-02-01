/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* MODIFIED FOR NEXT.JS 15 COMPATIBILITY - params/searchParams are now Promises */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

// Force dynamic rendering - skip build-time DB queries
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  // Type assertion needed: Payload types don't match Next.js 15 Promise-based params yet
  return generatePageMetadata({ config, params: resolvedParams as any, searchParams: resolvedSearchParams as any })
}

const Page = async ({ params, searchParams }: Args) => {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  // Type assertion needed: Payload types don't match Next.js 15 Promise-based params yet
  return RootPage({ config, importMap, params: resolvedParams as any, searchParams: resolvedSearchParams as any })
}

export default Page
