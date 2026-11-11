import type { FormPrintSchema } from '../formSchema.types'
import { PRINT_ROOT_ID } from './FormPrintPortal'

export const PRINT_STYLE_TAG_ID = 'e-form-print-style'

/**
 * Sinh CSS @page/@media print theo print_schema.
 * Dùng kỹ thuật visibility (không phải `body > *:not(#id){display:none}`) để an toàn với Next root:
 * ẩn toàn bộ body khi in, chỉ hiện lại subtree của #e-form-print-root.
 */
export const buildPrintCss = (printSchema: FormPrintSchema): string => `
@page {
  size: ${printSchema.page.size} ${printSchema.page.orientation};
  margin: ${printSchema.page.margin_top_mm}mm ${printSchema.page.margin_right_mm}mm ${printSchema.page.margin_bottom_mm}mm ${printSchema.page.margin_left_mm}mm;
}

@media print {
  body * {
    visibility: hidden;
  }

  #${PRINT_ROOT_ID}, #${PRINT_ROOT_ID} * {
    visibility: visible;
  }

  #${PRINT_ROOT_ID} {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  .e-form-page-break {
    page-break-before: always;
    break-before: page;
  }

  ${printSchema.options.avoid_section_page_break ? '.e-form-print-section { page-break-inside: avoid; break-inside: avoid; }' : ''}
  ${printSchema.options.repeat_table_header ? '.e-form-print-root table thead { display: table-header-group; }' : ''}
}
`

export const ensurePrintStylesInjected = (printSchema: FormPrintSchema) => {
  if (typeof document === 'undefined') return

  let styleTag = document.getElementById(PRINT_STYLE_TAG_ID) as HTMLStyleElement | null

  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.id = PRINT_STYLE_TAG_ID
    document.head.appendChild(styleTag)
  }

  styleTag.textContent = buildPrintCss(printSchema)
}

export const removePrintStyles = () => {
  if (typeof document === 'undefined') return

  document.getElementById(PRINT_STYLE_TAG_ID)?.remove()
}
