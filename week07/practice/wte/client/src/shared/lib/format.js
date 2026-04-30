export function formatDateTime(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function buildPageHref(pathname, page) {
  const url = new URL(pathname, window.location.origin)
  url.searchParams.set('page', String(page))
  return `${url.pathname}${url.search}`
}
