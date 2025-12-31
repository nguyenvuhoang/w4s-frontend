export function getGridSizeByView(view: any): number {
  return view?.size && typeof view.size === 'number' ? view.size : 6;
}
