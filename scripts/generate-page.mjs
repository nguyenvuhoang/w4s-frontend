#!/usr/bin/env node
/**
 * Generate Enterprise Console Page Structure
 * 
 * Usage:
 *   node scripts/generate-page.mjs user-management
 *   node scripts/generate-page.mjs api-gateway --type nolayout
 *   node scripts/generate-page.mjs reports/monthly --skip-error
 * 
 * Creates:
 *   - app/[locale]/(dashboard)/(portal)/(nolayout)/[page-name]/page.tsx
 *   - views/nolayout/[page-name]/index.tsx
 *   - views/nolayout/[page-name]/[PageName]Error.tsx
 *   - views/nolayout/[page-name]/[PageName]Skeleton.tsx
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ========== ARGUMENTS ==========
const args = process.argv.slice(2)
const pagePath = args[0]
const flags = {
  type: args.includes('--type') ? args[args.indexOf('--type') + 1] : 'nolayout',
  skipError: args.includes('--skip-error'),
  skipSkeleton: args.includes('--skip-skeleton'),
  view: args.includes('--view'),
}

if (!pagePath) {
  console.error('❌ Error: Page path is required')
  console.log('\nUsage: node scripts/generate-page.mjs <page-path> [options]')
  console.log('\nOptions:')
  console.log('  --type <nolayout|normal>    Layout type (default: nolayout)')
  console.log('  --skip-error                Skip error component generation')
  console.log('  --skip-skeleton             Skip skeleton component generation')
  console.log('  --view                      Add view subpage ([...slug])')
  console.log('\nExamples:')
  console.log('  node scripts/generate-page.mjs user-management')
  console.log('  node scripts/generate-page.mjs api-logs --skip-error')
  console.log('  node scripts/generate-page.mjs reports/monthly --view')
  process.exit(1)
}

// ========== UTILS ==========
function toPascalCase(str) {
  return str
    .split(/[-_/]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function toKebabCase(str) {
  return str.toLowerCase().replace(/[_/]/g, '-')
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// ========== PATHS ==========
const pageNameKebab = toKebabCase(pagePath)
const pageNamePascal = toPascalCase(pagePath)
const isNested = pagePath.includes('/')
const baseName = isNested ? path.basename(pagePath) : pagePath

const serverPageDir = path.join(
  ROOT,
  'src/app/[locale]/(dashboard)/(portal)',
  flags.type === 'nolayout' ? '(nolayout)' : '',
  pageNameKebab
)
const viewDir = path.join(
  ROOT,
  `src/views/${flags.type === 'nolayout' ? 'nolayout' : 'pages'}`,
  pageNameKebab
)

// ========== TEMPLATES ==========
const templates = {
  serverPage: `import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import ${pageNamePascal}Content from '@/views/${flags.type === 'nolayout' ? 'nolayout' : 'pages'}/${pageNameKebab}'
import ${pageNamePascal}Skeleton from '@/views/${flags.type === 'nolayout' ? 'nolayout' : 'pages'}/${pageNameKebab}/${pageNamePascal}Skeleton'
import { Suspense } from 'react'
import ContentWrapper from '@/views/components/layout/content-wrapper'
import DescriptionIcon from '@mui/icons-material/Description'

type Params = Promise<{
    locale: Locale
}>

async function ${pageNamePascal}Data({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)

    // TODO: Add your API call here
    // Example:
    // const dataSearchAPI = await systemServiceApi.searchSystemData({
    //     sessiontoken: session?.user?.token as string,
    //     workflowid: \`YOUR_WORKFLOW_ID\`,
    //     searchtext: '',
    //     pageSize: 10,
    //     pageIndex: 0
    // })

    return <${pageNamePascal}Content dictionary={dictionary} session={session} locale={locale}/>
}

const ${pageNamePascal}Page = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper 
            icon={<DescriptionIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            title={\`\${dictionary['${pageNameKebab.replace(/-/g, '')}']?.title || '${pageNamePascal}'}\`}
            description={dictionary['${pageNameKebab.replace(/-/g, '')}']?.description || '${pageNamePascal} page'}
            dictionary={dictionary}
        >
            <Suspense fallback={<${pageNamePascal}Skeleton dictionary={dictionary} />}>
                <${pageNamePascal}Data locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default ${pageNamePascal}Page
`,

  viewIndex: `'use client'

import { useState } from 'react'
import type { Locale } from '@configs/i18n'

// Components
import { Card, CardContent, Typography } from '@mui/material'

type Props = {
  locale: Locale
  dictionary: any
  session: any
}

export default function ${pageNamePascal}Content({ locale, dictionary, session }: Props) {
  const [loading, setLoading] = useState(false)

  return (
    <Card>
      <CardContent>
        <Typography variant='h4' className='mb-4'>
          {dictionary['${pageNameKebab.replace(/-/g, '')}']?.title || '${pageNamePascal}'}
        </Typography>
        
        {/* TODO: Implement your content here */}
        <Typography variant='body2' color='text.secondary'>
          Locale: {locale}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          User: {session?.user?.email || 'Not logged in'}
        </Typography>
      </CardContent>
    </Card>
  )
}
`,

  viewError: `'use client'

import { Card, CardContent, Typography, Button } from '@mui/material'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ${pageNamePascal}Error({ error, reset }: Props) {
  return (
    <Card>
      <CardContent className='flex flex-col items-center gap-4 py-8'>
        <Typography variant='h5' color='error'>
          ${pageNamePascal} Error
        </Typography>
        <Typography variant='body2' color='text.secondary' className='text-center'>
          {error.message || 'Something went wrong loading ${baseName}'}
        </Typography>
        <Button variant='contained' onClick={reset}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}
`,

  viewSkeleton: `import { Card, CardContent, Skeleton, Stack } from '@mui/material'

type Props = {
  dictionary: any
}

export default function ${pageNamePascal}Skeleton({ dictionary }: Props) {
  return (
    <Card>
      <CardContent>
        <Skeleton variant='text' width='40%' height={40} className='mb-4' />
        
        <Stack spacing={2}>
          <Skeleton variant='rectangular' height={60} />
          <Skeleton variant='rectangular' height={200} />
          <Skeleton variant='rectangular' height={100} />
        </Stack>
      </CardContent>
    </Card>
  )
}
`,

  viewSubpage: `import type { Locale } from '@configs/i18n'
import ${pageNamePascal}ViewContent from '@/views/${flags.type === 'nolayout' ? 'nolayout' : 'pages'}/${pageNameKebab}/view'

type Props = {
  params: Promise<{ locale: Locale; slug: string[] }>
}

export default async function ${pageNamePascal}ViewPage(props: Props) {
  const params = await props.params
  const { locale, slug } = params
  const id = slug[0]

  return <${pageNamePascal}ViewContent locale={locale} id={id} />
}
`,

  viewSubpageContent: `'use client'

import { Card, CardContent, Typography } from '@mui/material'
import type { Locale } from '@configs/i18n'

type Props = {
  locale: Locale
  id: string
}

export default function ${pageNamePascal}ViewContent({ locale, id }: Props) {
  return (
    <Card>
      <CardContent>
        <Typography variant='h4' className='mb-4'>
          ${pageNamePascal} Details
        </Typography>
        
        {/* TODO: Implement detail view */}
        <Typography variant='body2' color='text.secondary'>
          ID: {id} | Locale: {locale}
        </Typography>
      </CardContent>
    </Card>
  )
}
`,
}

// ========== GENERATE ==========
console.log('🚀 Generating Enterprise Console Page Structure...\n')
console.log(`📄 Page: ${pageNameKebab}`)
console.log(`📦 Type: ${flags.type}`)
console.log(`🔧 View subpage: ${flags.view ? 'Yes' : 'No'}\n`)

// 1. Server page
ensureDir(serverPageDir)
const serverPagePath = path.join(serverPageDir, 'page.tsx')
fs.writeFileSync(serverPagePath, templates.serverPage)
console.log('✅ Created:', path.relative(ROOT, serverPagePath))

// 2. View index
ensureDir(viewDir)
const viewIndexPath = path.join(viewDir, 'index.tsx')
fs.writeFileSync(viewIndexPath, templates.viewIndex)
console.log('✅ Created:', path.relative(ROOT, viewIndexPath))

// 3. Error component
if (!flags.skipError) {
  const errorPath = path.join(viewDir, `${pageNamePascal}Error.tsx`)
  fs.writeFileSync(errorPath, templates.viewError)
  console.log('✅ Created:', path.relative(ROOT, errorPath))
}

// 4. Skeleton component
if (!flags.skipSkeleton) {
  const skeletonPath = path.join(viewDir, `${pageNamePascal}Skeleton.tsx`)
  fs.writeFileSync(skeletonPath, templates.viewSkeleton)
  console.log('✅ Created:', path.relative(ROOT, skeletonPath))
}

// 5. View subpage
if (flags.view) {
  const viewSubDir = path.join(serverPageDir, 'view/[...slug]')
  ensureDir(viewSubDir)
  const viewSubPagePath = path.join(viewSubDir, 'page.tsx')
  fs.writeFileSync(viewSubPagePath, templates.viewSubpage)
  console.log('✅ Created:', path.relative(ROOT, viewSubPagePath))

  const viewContentDir = path.join(viewDir, 'view')
  ensureDir(viewContentDir)
  const viewContentPath = path.join(viewContentDir, 'index.tsx')
  fs.writeFileSync(viewContentPath, templates.viewSubpageContent)
  console.log('✅ Created:', path.relative(ROOT, viewContentPath))
}

console.log('\n✨ Done! Next steps:')
console.log(`   1. Edit: src/views/${flags.type === 'nolayout' ? 'nolayout' : 'pages'}/${pageNameKebab}/index.tsx`)
console.log(`   2. Add translations to src/data/dictionaries/ with key '${pageNameKebab.replace(/-/g, '')}'`)
console.log(`   3. Add menu entry in src/data/navigation/verticalMenuData.tsx`)
console.log(`   4. Add API call in ${pageNamePascal}Data component (see TODO comment)`)
console.log(`   5. Visit: http://localhost:3000/en/${pageNameKebab}\n`)
