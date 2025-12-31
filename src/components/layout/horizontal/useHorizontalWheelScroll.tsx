import React from 'react'

export function useHorizontalWheelScroll(containerRef: React.RefObject<HTMLElement | null>) {
    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Tìm phần tử cuộn ngang gần nhất theo event target
        const findScrollableX = (start: HTMLElement | null): HTMLElement | null => {
            let el: HTMLElement | null = start
            while (el && el !== container) {
                const style = getComputedStyle(el)
                const canScrollX =
                    (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
                    el.scrollWidth > el.clientWidth
                if (canScrollX) return el
                el = el.parentElement
            }
            return null
        }

        const onWheel = (ev: WheelEvent) => {
            // Ưu tiên phần tử cuộn ngay dưới con trỏ
            const target = ev.target as HTMLElement
            const scrollEl =
                findScrollableX(target) ||
                // fallback: tìm ul/menubar bên trong container
                (container.querySelector('[role="menubar"], nav ul, ul') as HTMLElement | null)

            if (!scrollEl) return

            // Nếu có thể cuộn ngang thì chuyển deltaY -> scrollLeft
            const hasOverflowX = scrollEl.scrollWidth > scrollEl.clientWidth
            if (hasOverflowX && Math.abs(ev.deltaY) >= Math.abs(ev.deltaX)) {
                scrollEl.scrollLeft += ev.deltaY
                ev.preventDefault() // cần passive:false
            }
        }

        // native listener để set passive:false
        container.addEventListener('wheel', onWheel, { passive: false })

        return () => container.removeEventListener('wheel', onWheel)
    }, [containerRef])
}
