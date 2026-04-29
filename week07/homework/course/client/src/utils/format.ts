export function toPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function statusText(status: string) {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    active: '活跃',
    inactive: '非活跃',
  };
  return map[status] || status;
}
