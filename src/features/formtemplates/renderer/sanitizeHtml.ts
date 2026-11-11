const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'SPAN', 'DIV',
  'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'A', 'H1', 'H2', 'H3', 'H4'
])

const ALLOWED_ATTRS: Record<string, string[]> = {
  A: ['href', 'target', 'rel']
}

const isSafeHref = (href: string) => {
  const trimmed = href.trim().toLowerCase()

  return !trimmed.startsWith('javascript:') && !trimmed.startsWith('data:')
}

const sanitizeNode = (node: ChildNode) => {
  if (node.nodeType === Node.TEXT_NODE) return

  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.parentNode?.removeChild(node)

    return
  }

  const element = node as Element

  if (!ALLOWED_TAGS.has(element.tagName)) {
    // Không xoá text bên trong tag không được phép — chỉ "unwrap" tag, giữ nội dung.
    const parent = element.parentNode

    while (element.firstChild) parent?.insertBefore(element.firstChild, element)
    parent?.removeChild(element)

    return
  }

  Array.from(element.attributes).forEach(attr => {
    const allowed = ALLOWED_ATTRS[element.tagName] ?? []

    if (attr.name.startsWith('on') || !allowed.includes(attr.name.toLowerCase())) {
      element.removeAttribute(attr.name)
    }
  })

  if (element.tagName === 'A') {
    const href = element.getAttribute('href')

    if (href && !isSafeHref(href)) element.removeAttribute('href')
    element.setAttribute('rel', 'noopener noreferrer')
    element.setAttribute('target', '_blank')
  }

  Array.from(element.childNodes).forEach(sanitizeNode)
}

/**
 * Sanitize HTML thô cho component `static_html` — chỉ dùng DOMParser có sẵn trên trình duyệt,
 * không thêm dependency (dompurify...) mới. Loại bỏ script/style/iframe/event-handler/javascript:.
 * Chỉ chạy phía client (DOMParser không có trên server).
 */
export const sanitizeStaticHtml = (rawHtml: string): string => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return ''

  const doc = new DOMParser().parseFromString(rawHtml ?? '', 'text/html')

  Array.from(doc.body.childNodes).forEach(sanitizeNode)

  return doc.body.innerHTML
}
