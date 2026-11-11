'use client'

import { Paper, Tab, Tabs } from '@mui/material'

import type { WorkflowsDictionary } from '../types'
import { workflowChannelTabs, workflowText } from './workflowHelpers'

type Props = {
  dictionary: WorkflowsDictionary
  value: string
  loading: boolean
  onChange: (channelId: string) => void
}

const WorkflowsChannelTabs = ({ dictionary, value, loading, onChange }: Props) => (
  <Paper variant="outlined" sx={{ borderRadius: 2 }}>
    <Tabs
      value={value}
      onChange={(_event, nextValue: string) => onChange(nextValue)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ px: 1, minHeight: 44 }}
    >
      {workflowChannelTabs.map(tab => (
        <Tab
          key={tab.value || 'all'}
          value={tab.value}
          label={workflowText(dictionary, tab.labelKey, tab.fallback)}
          disabled={loading}
          sx={{ minHeight: 44 }}
        />
      ))}
    </Tabs>
  </Paper>
)

export default WorkflowsChannelTabs
