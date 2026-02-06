/**
 * System Service API
 * 
 * This is the main entry point for system service operations.
 * All functions have been organized into separate service modules:
 * 
 * - menuService: Menu operations (load, create, update, delete)
 * - formService: Form and system info operations
 * - codeService: Code list operations
 * - dataService: Search, view, and update operations
 * - workflowService: BO/FO workflow operations
 * - reportService: Report loading operations
 * - logService: Workflow log operations
 * 
 * For better maintainability, import specific services instead:
 * @example
 * import { menuService } from '@/servers/system-service/services/menu.service'
 * import { dataService } from '@/servers/system-service/services/data.service'
 */

// Export all service modules
export { codeService } from './services/code.service';
export { dataService } from './services/data.service';
export { formService } from './services/form.service';
export { logService } from './services/log.service';
export { menuService } from './services/menu.service';
export { reportService } from './services/report.service';
export { workflowService } from './services/workflow.service';

// Legacy export for backward compatibility
// Import all services
import { codeService } from './services/code.service';
import { dataService } from './services/data.service';
import { formService } from './services/form.service';
import { learnAPIService } from './services/learnapi.service';
import { logService } from './services/log.service';
import { menuService } from './services/menu.service';
import { reportService } from './services/report.service';
import { workflowService } from './services/workflow.service';

/**
 * @deprecated Use individual service imports instead
 * This combined API object is maintained for backward compatibility
 * but it's recommended to import specific services directly
 */
export const systemServiceApi = {
    // Form Service
    ...formService,

    // Menu Service
    ...menuService,

    // Code Service
    ...codeService,

    // Data Service
    ...dataService,

    // Workflow Service
    ...workflowService,

    // Report Service
    ...reportService,

    // Log Service
    ...logService,

    // LearnAPI Service
    ...learnAPIService,
}
