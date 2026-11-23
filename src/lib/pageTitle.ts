export const SITE_NAME = '生活選物店'

/** "商品列表 | 生活選物店"; the bare site name for pages without their own title. */
export function buildPageTitle(pageName: string | null | undefined): string {
  const trimmed = pageName?.trim() ?? ''
  return trimmed === '' ? SITE_NAME : `${trimmed} | ${SITE_NAME}`
}
