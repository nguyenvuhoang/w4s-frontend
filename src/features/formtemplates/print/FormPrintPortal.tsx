'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export const PRINT_ROOT_ID = 'e-form-print-root'

const usePrintPortalNode = () => {
  const [node, setNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let element = document.getElementById(PRINT_ROOT_ID)
    let created = false

    if (!element) {
      element = document.createElement('div')
      element.id = PRINT_ROOT_ID
      document.body.appendChild(element)
      created = true
    }

    element.style.position = 'fixed'
    element.style.left = '-100000px'
    element.style.top = '0'
    element.style.width = '210mm'
    element.style.pointerEvents = 'none'
    element.style.zIndex = '-1'
    element.setAttribute('aria-hidden', 'true')

    setNode(element)

    return () => {
      if (created && element?.parentNode) element.parentNode.removeChild(element)
    }
  }, [])

  return node
}

type Props = {
  children: React.ReactNode
}

/**
 * Render nội dung in vào một node riêng gắn trực tiếp vào document.body (React portal),
 * KHÔNG dùng CSS kiểu `body > *:not(#id){display:none}` (rủi ro ẩn luôn Next root).
 * Ẩn/hiện khi in dùng kỹ thuật visibility chuẩn — xem printSchemaCss.ts.
 */
const FormPrintPortal = ({ children }: Props) => {
  const node = usePrintPortalNode()

  if (!node) return null

  return createPortal(children, node)
}

export default FormPrintPortal
