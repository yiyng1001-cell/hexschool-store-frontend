import { describe, expect, it } from 'vitest'

import { buildPageTitle } from './pageTitle'

describe('buildPageTitle', () => {
  it('appends the site name to a page name', () => {
    expect(buildPageTitle('商品列表')).toBe('商品列表 | 生活選物店')
  })

  it.each([undefined, null, '', '   '])('falls back to the site name for %j', (pageName) => {
    expect(buildPageTitle(pageName)).toBe('生活選物店')
  })
})
