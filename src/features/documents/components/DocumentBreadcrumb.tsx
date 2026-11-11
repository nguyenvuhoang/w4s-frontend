import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { Breadcrumbs, Button, Link, Paper, Stack, Typography } from '@mui/material'

import type { DocumentBreadcrumbItem } from '../types'
import { documentText, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  breadcrumb: DocumentBreadcrumbItem[]
  parent_id: string | null
  on_navigate: (folder_id: string) => void
  on_parent: () => void
}

const DocumentBreadcrumb = ({ dictionary, breadcrumb, parent_id, on_navigate, on_parent }: Props) => (
  <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
      <Breadcrumbs aria-label="folder breadcrumb">
        {breadcrumb.map((item, index) => {
          const is_last = index === breadcrumb.length - 1

          return is_last ? (
            <Typography key={item.id} color="text.primary" fontWeight={800}>
              {item.name}
            </Typography>
          ) : (
            <Link key={item.id} component="button" underline="hover" color="inherit" onClick={() => on_navigate(item.id)}>
              {item.name}
            </Link>
          )
        })}
      </Breadcrumbs>
      <Button size="small" variant="outlined" startIcon={<ArrowUpwardIcon />} disabled={!parent_id} onClick={on_parent}>
        {documentText(dictionary, 'go_parent_folder')}
      </Button>
    </Stack>
  </Paper>
)

export default DocumentBreadcrumb
