/**
 * Dynamic Pages Module
 * 
 * This module contains components for rendering dynamic forms
 * based on form_design_detail layouts from the API.
 * 
 * Exports:
 * - DynamicFormRenderer: Main component that renders dynamic forms
 * - RenderInputItem: Component that renders individual input types
 * - RenderInputItemProps: TypeScript interface for RenderInputItem props
 */

export { default as DynamicFormRenderer } from './DynamicFormRenderer';
export { default as RenderInputItem, type RenderInputItemProps } from './RenderInputItem';
