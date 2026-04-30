import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { PostStreamItem } from './PostStreamItem'

const basePost = {
  id: 1,
  title: '测试帖子',
  comment_count: 0,
  created_at: new Date().toISOString(),
  author: {
    username: 'jack',
    nickname: 'Jack',
    avatar_url: '/avatars/avatar-3.png',
  },
}

function renderItem(post = basePost) {
  return render(
    <MemoryRouter>
      <PostStreamItem post={post} topic={{ name: 'web' }} />
    </MemoryRouter>,
  )
}

describe('PostStreamItem', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the author avatar image when avatar_url is present', () => {
    renderItem()

    const avatar = screen.getByAltText('Jack 的头像')

    expect(avatar).toHaveAttribute('src', '/avatars/avatar-3.png')
    expect(screen.queryByText('J')).not.toBeInTheDocument()
  })

  it('falls back to the author initial when avatar_url is missing', () => {
    renderItem({
      ...basePost,
      author: {
        username: 'huiyou',
        nickname: 'huiyou',
        avatar_url: null,
      },
    })

    expect(screen.getByText('h')).toBeInTheDocument()
  })
})
