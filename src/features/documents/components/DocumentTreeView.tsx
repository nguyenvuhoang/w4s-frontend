import FolderRoundedIcon from '@mui/icons-material/FolderRounded'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'

import type { DocumentFolderTreeNode, DocumentNodeModel } from '../types'
import { documentText, type DocumentDictionary } from './documentHelpers'
import DocumentCompactView from './DocumentCompactView'

type Props = {
  dictionary: DocumentDictionary
  tree: DocumentFolderTreeNode[]
  root_folder_id: string
  selected_folder_id: string
  rows: DocumentNodeModel[]
  loading: boolean
  page_size: number
  empty_text: string
  is_trash?: boolean
  on_navigate: (folder_id: string) => void
  on_trash: () => void
  on_open: (row: DocumentNodeModel) => void
  on_open_action_menu: (event: React.MouseEvent<HTMLElement>, row: DocumentNodeModel) => void
}

const renderTree = (node: DocumentFolderTreeNode, on_navigate: (folder_id: string) => void) => (
  <TreeItem
    key={node.id}
    itemId={node.id}
    label={
      <Stack direction="row" gap={1} alignItems="center" onClick={() => on_navigate(node.id)}>
        <FolderRoundedIcon sx={{ color: '#f2b705' }} fontSize="small" />
        <Typography variant="body2" noWrap>{node.name}</Typography>
      </Stack>
    }
  >
    {node.children.map(child => renderTree(child, on_navigate))}
  </TreeItem>
)

const DocumentTreeView = ({ dictionary, tree, root_folder_id, selected_folder_id, rows, loading, page_size, empty_text, is_trash = false, on_navigate, on_trash, on_open, on_open_action_menu }: Props) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' }, gap: 2 }}>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minHeight: 420 }}>
      <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1.5 }}>{documentText(dictionary, 'folder_tree')}</Typography>
      <SimpleTreeView selectedItems={is_trash ? 'trash' : selected_folder_id} defaultExpandedItems={[root_folder_id, ...tree.map(item => item.id)]}>
        <TreeItem
          itemId={root_folder_id}
          label={
            <Stack direction="row" gap={1} alignItems="center" onClick={() => on_navigate(root_folder_id)}>
              <FolderRoundedIcon sx={{ color: '#f2b705' }} fontSize="small" />
              <Typography variant="body2" noWrap>{documentText(dictionary, 'default_folder_name')}</Typography>
            </Stack>
          }
        >
          {tree.map(node => renderTree(node, on_navigate))}
        </TreeItem>
        <TreeItem
          itemId="trash"
          label={
            <Stack direction="row" gap={1} alignItems="center" onClick={on_trash}>
              <DeleteOutlineIcon sx={{ color: 'text.secondary' }} fontSize="small" />
              <Typography variant="body2" noWrap>{documentText(dictionary, 'trash')}</Typography>
            </Stack>
          }
        />
      </SimpleTreeView>
    </Paper>
    <DocumentCompactView
      dictionary={dictionary}
      rows={rows}
      loading={loading}
      page_size={page_size}
      empty_text={empty_text}
      on_open={on_open}
      on_open_action_menu={on_open_action_menu}
      show_actions={!is_trash}
    />
  </Box>
)

export default DocumentTreeView
