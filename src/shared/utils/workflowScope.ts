import { WORKFLOWCODE } from '@/data/WorkflowCode'

/**
 * Workflows that are not tied to a working project (menu, BO context, project catalog). The
 * `scope` header is never sent for them, whatever project is currently selected.
 */
const PROJECT_INDEPENDENT_WORKFLOWS: ReadonlySet<string> = new Set([
  WORKFLOWCODE.WF_BO_LOAD_MENU,
  WORKFLOWCODE.WF_BO_GET_BO_CONTEXT,
  WORKFLOWCODE.WF_BO_SIMPLE_SEARCH_PROJECTS
])

export const isProjectIndependentWorkflow = (workflowId: unknown): boolean =>
  typeof workflowId === 'string' && PROJECT_INDEPENDENT_WORKFLOWS.has(workflowId)

/** The scope to send for this workflow, or `undefined` when the header must be omitted. */
export const resolveWorkflowScope = (workflowId: unknown, scope: string | null | undefined): string | undefined => {
  if (isProjectIndependentWorkflow(workflowId)) return undefined

  const value = typeof scope === 'string' ? scope.trim() : ''

  return value || undefined
}
