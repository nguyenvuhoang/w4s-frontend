'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import CloseRounded from '@mui/icons-material/CloseRounded'
import CodeRounded from '@mui/icons-material/CodeRounded'
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { WorkflowsDictionary, WorkflowStepItem } from '../types'
import {
  buildSequentialWorkflowGraph,
  getWorkflowGraphLayout,
  getWorkflowGraphStorageKey,
  getWorkflowStepNodeId,
  isWorkflowGraphConnectionValid,
  type WorkflowGraphNodeData,
  type WorkflowGraphLayout
} from '../workflowGraph'
import { commonText, workflowText } from './workflowHelpers'

type Props = {
  dictionary: WorkflowsDictionary
  workflowId: string
  steps: WorkflowStepItem[]
}

const layoutFor = (workflowId: string): WorkflowGraphLayout => {
  if (typeof window === 'undefined') return {}

  try {
    const parsed = JSON.parse(window.localStorage.getItem(getWorkflowGraphStorageKey(workflowId)) ?? '{}')

    return parsed && typeof parsed === 'object' ? parsed as WorkflowGraphLayout : {}
  } catch {
    return {}
  }
}

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value !== 'string') return String(value)

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

const WorkflowBoundaryNode = ({ data }: NodeProps<Node<WorkflowGraphNodeData>>) => (
  <Paper elevation={0} sx={{ minWidth: 108, px: 2, py: 1.2, borderRadius: 9, border: 1, borderColor: data.kind === 'start' ? 'success.main' : 'error.main', bgcolor: data.kind === 'start' ? 'success.lighter' : 'error.lighter', textAlign: 'center' }}>
    {data.kind === 'start' && <Handle type="source" position={Position.Right} />}
    <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
      <PlayArrowRounded fontSize="small" color={data.kind === 'start' ? 'success' : 'error'} />
      <Typography variant="subtitle2" fontWeight={800}>{data.label}</Typography>
    </Stack>
    {data.kind === 'end' && <Handle type="target" position={Position.Left} />}
  </Paper>
)

const WorkflowStepNode = ({ id, data, selected }: NodeProps<Node<WorkflowGraphNodeData>>) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const step = data.step

  if (!step) return null

  return (
    <Paper elevation={selected ? 5 : 1} sx={{ width: 245, border: 1, borderColor: selected ? 'primary.main' : 'divider', borderRadius: 2, overflow: 'visible' }}>
      <Handle type="target" position={Position.Left} />
      <Stack spacing={0.75} sx={{ p: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={0.75}>
          <Stack direction="row" spacing={0.75} alignItems="center" minWidth={0}>
            <Chip size="small" color="primary" label={step.step_order} />
            <Typography variant="subtitle2" fontWeight={800} noWrap>{step.step_code}</Typography>
          </Stack>
          <IconButton size="small" aria-label="Node actions" onClick={event => { event.stopPropagation(); setMenuAnchor(event.currentTarget) }}><MoreVertRounded fontSize="small" /></IconButton>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ minHeight: 30 }}>{step.description || '-'}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{step.service_id || '-'}</Typography>
      </Stack>
      <Handle type="source" position={Position.Right} />
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { data.onViewDetail?.(step); setMenuAnchor(null) }}>{data.menuLabels?.viewDetail}</MenuItem>
        <MenuItem onClick={() => { data.onViewCode?.(step); setMenuAnchor(null) }}>{data.menuLabels?.viewCode}</MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { data.onRemove?.(id); setMenuAnchor(null) }}>{data.menuLabels?.remove}</MenuItem>
      </Menu>
    </Paper>
  )
}

const nodeTypes = { workflowBoundary: WorkflowBoundaryNode, workflowStep: WorkflowStepNode }

const WorkflowGraphDesigner = ({ dictionary, workflowId, steps }: Props) => {
  const graphLabels = useMemo(() => ({
    start: workflowText(dictionary, 'graph_start', 'Start'),
    end: workflowText(dictionary, 'graph_end', 'End'),
    menu: {
      viewDetail: workflowText(dictionary, 'graph_view_detail', 'View details'),
      viewCode: workflowText(dictionary, 'graph_view_code', 'View code'),
      remove: workflowText(dictionary, 'graph_remove_step', 'Remove from workflow')
    }
  }), [dictionary])
  const [nodes, setNodes] = useState<Array<Node<WorkflowGraphNodeData>>>(() => buildSequentialWorkflowGraph(steps, layoutFor(workflowId), graphLabels).nodes)
  const [edges, setEdges] = useState<Edge[]>(() => buildSequentialWorkflowGraph(steps, layoutFor(workflowId), graphLabels).edges)
  const [selectedStep, setSelectedStep] = useState<WorkflowStepItem | null>(null)
  const [sourceStep, setSourceStep] = useState<WorkflowStepItem | null>(null)
  const [searchText, setSearchText] = useState('')

  const removeNode = useCallback((nodeId: string) => {
    setNodes(current => current.filter(node => node.id !== nodeId))
    setEdges(current => current.filter(edge => edge.source !== nodeId && edge.target !== nodeId))
  }, [])
  const decorateNodes = useCallback((graphNodes: Array<Node<WorkflowGraphNodeData>>) => graphNodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onViewDetail: setSelectedStep,
      onViewCode: setSourceStep,
      onRemove: removeNode,
      menuLabels: graphLabels.menu
    }
  })), [graphLabels.menu, removeNode])

  useEffect(() => {
    const graph = buildSequentialWorkflowGraph(steps, layoutFor(workflowId), graphLabels)
    setNodes(decorateNodes(graph.nodes))
    setEdges(graph.edges)
  }, [decorateNodes, graphLabels, steps, workflowId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getWorkflowGraphStorageKey(workflowId), JSON.stringify(getWorkflowGraphLayout(nodes)))
  }, [nodes, workflowId])

  const onNodesChange = useCallback((changes: NodeChange<Node<WorkflowGraphNodeData>>[]) => setNodes(current => applyNodeChanges(changes, current)), [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(current => applyEdgeChanges(changes, current)), [])
  const onConnect = useCallback((connection: Connection) => {
    if (!isWorkflowGraphConnectionValid(connection, edges)) return
    setEdges(current => addEdge({ ...connection, type: 'smoothstep' }, current))
  }, [edges])
  const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }, [])
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const stepCode = event.dataTransfer.getData('application/o24-workflow-step')
    const step = steps.find(item => item.step_code === stepCode)
    if (!step) return
    const id = getWorkflowStepNodeId(step.step_code)
    setNodes(current => current.some(node => node.id === id) ? current : [...current, {
      id, type: 'workflowStep', position: { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY }, data: { kind: 'step', label: step.step_code, step, onViewDetail: setSelectedStep, onViewCode: setSourceStep, onRemove: removeNode, menuLabels: graphLabels.menu }
    }])
  }, [graphLabels.menu, removeNode, steps])
  const addStep = useCallback((step: WorkflowStepItem) => {
    const id = getWorkflowStepNodeId(step.step_code)
    setNodes(current => current.some(node => node.id === id) ? current : [...current, {
      id, type: 'workflowStep', position: { x: 340, y: 380 + current.length * 20 }, data: { kind: 'step', label: step.step_code, step, onViewDetail: setSelectedStep, onViewCode: setSourceStep, onRemove: removeNode, menuLabels: graphLabels.menu }
    }])
  }, [graphLabels.menu, removeNode])

  const availableSteps = useMemo(() => steps.filter(step => `${step.step_code} ${step.description}`.toLowerCase().includes(searchText.trim().toLowerCase())), [searchText, steps])
  const isolatedNodes = useMemo(() => nodes.filter(node => node.data.kind === 'step' && !edges.some(edge => edge.source === node.id || edge.target === node.id)), [edges, nodes])
  const graphWarning = isolatedNodes.length > 0 ? workflowText(dictionary, 'graph_isolated_nodes', 'Connect every workflow step before saving.') : null
  const sourceMetadata = sourceStep ? [
    ['StepCode', sourceStep.step_code],
    [workflowText(dictionary, 'field_service_id', 'Service'), sourceStep.service_id],
    [workflowText(dictionary, 'field_processing_number', 'Processing Type'), sourceStep.processing_number]
  ] : []

  return (
    <Stack spacing={2}>
      <Alert severity="info">{workflowText(dictionary, 'graph_local_layout_notice', 'Node positions are stored only in this browser. They do not change workflow execution until a backend save API is available.')}</Alert>
      {graphWarning && <Alert severity="warning">{graphWarning}</Alert>}
      <Paper sx={{ minHeight: 650, overflow: 'hidden', borderRadius: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '250px minmax(0, 1fr)' } }}>
        <Box sx={{ p: 2, borderRight: { lg: 1 }, borderBottom: { xs: 1, lg: 0 }, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="subtitle1" fontWeight={800}>{workflowText(dictionary, 'graph_available_steps', 'Available steps')}</Typography>
          <TextField size="small" fullWidth sx={{ my: 1.5 }} value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={workflowText(dictionary, 'graph_search_steps', 'Search by StepCode or description')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }} />
          <Typography variant="caption" color="text.secondary">{workflowText(dictionary, 'graph_drag_step_hint', 'Drag a step onto the canvas or select it to restore a removed node.')}</Typography>
          <List dense disablePadding sx={{ mt: 1.5, maxHeight: 515, overflowY: 'auto' }}>
            {availableSteps.map(step => <ListItemButton key={`${step.step_order}-${step.step_code}`} draggable onDragStart={event => event.dataTransfer.setData('application/o24-workflow-step', step.step_code)} onClick={() => addStep(step)} sx={{ borderRadius: 1, mb: 0.5 }}>
              <DragIndicatorRounded fontSize="small" color="disabled" sx={{ mr: 0.75 }} />
              <ListItemText primary={step.step_code} secondary={step.description || step.service_id || '-'} primaryTypographyProps={{ variant: 'body2', fontWeight: 700, noWrap: true }} secondaryTypographyProps={{ variant: 'caption', noWrap: true }} />
            </ListItemButton>)}
          </List>
        </Box>
        <Box onDrop={onDrop} onDragOver={onDragOver} sx={{ minWidth: 0, minHeight: 650 }}>
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} isValidConnection={connection => isWorkflowGraphConnectionValid(connection, edges)} fitView deleteKeyCode={['Backspace', 'Delete']} edgesFocusable nodesDraggable>
            <Background gap={18} size={1} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </Box>
      </Paper>
      <Stack direction="row" justifyContent="flex-end">
        <Tooltip title={workflowText(dictionary, 'graph_save_disabled_tooltip', 'Backend does not yet support saving the workflow diagram.')}><span><Button disabled variant="contained" startIcon={<SaveRounded />}>{commonText(dictionary, 'save', 'Save')}</Button></span></Tooltip>
      </Stack>

      <Drawer anchor="right" open={Boolean(selectedStep)} onClose={() => setSelectedStep(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
        {selectedStep && <Stack spacing={2} sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={800}>{workflowText(dictionary, 'graph_step_detail', 'Step details')}</Typography><IconButton onClick={() => setSelectedStep(null)}><CloseRounded /></IconButton></Stack>
          <Divider />
          {[
            [workflowText(dictionary, 'field_step_order', 'Order'), selectedStep.step_order],
            [workflowText(dictionary, 'field_step_code', 'Step Code'), selectedStep.step_code],
            [workflowText(dictionary, 'field_step_description', 'Description'), selectedStep.description],
            [workflowText(dictionary, 'field_service_id', 'Service'), selectedStep.service_id],
            [workflowText(dictionary, 'field_processing_number', 'Processing Type'), selectedStep.processing_number],
            [workflowText(dictionary, 'field_step_timeout', 'Timeout'), selectedStep.step_timeout],
            [workflowText(dictionary, 'field_sending_template', 'Sending template'), selectedStep.sending_template],
            [workflowText(dictionary, 'field_sub_sending_template', 'Sub sending template'), selectedStep.sub_sending_template],
            [workflowText(dictionary, 'field_mapping_response', 'Response mapping'), selectedStep.mapping_response],
            [workflowText(dictionary, 'field_sending_condition', 'Sending condition'), selectedStep.sending_condition],
            [workflowText(dictionary, 'field_worker_id_map', 'Worker ID map'), selectedStep.worker_id_map]
          ].map(([label, value]) => <Box key={String(label)}><Typography variant="caption" color="text.secondary">{label}</Typography><Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', m: 0, fontFamily: 'inherit', fontSize: '0.875rem' }}>{formatValue(value)}</Box></Box>)}
          <Button variant="outlined" startIcon={<CodeRounded />} onClick={() => setSourceStep(selectedStep)}>{workflowText(dictionary, 'graph_view_code', 'View code')}</Button>
        </Stack>}
      </Drawer>

      <Dialog open={Boolean(sourceStep)} onClose={() => setSourceStep(null)} fullWidth maxWidth="md">
        <DialogTitle>{workflowText(dictionary, 'graph_code_metadata', 'Step code metadata')}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>{workflowText(dictionary, 'graph_code_backend_notice', 'Source lookup will be available after the backend getStepSource API is configured.')}</Alert>
          <Box component="pre" sx={{ m: 0, p: 2, borderRadius: 1, bgcolor: 'action.hover', overflow: 'auto' }}>{sourceMetadata.map(([label, value]) => `${label}: ${value || '-'}`).join('\n')}</Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setSourceStep(null)}>{commonText(dictionary, 'close', 'Close')}</Button></DialogActions>
      </Dialog>
    </Stack>
  )
}

export default WorkflowGraphDesigner
