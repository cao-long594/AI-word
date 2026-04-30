import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CommentsSection } from './CommentsSection'

vi.mock('./api', () => ({
  createComment: vi.fn(),
  fetchComments: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        content: '评审时如果能把风险点写清楚，作者通常更容易接受修改建议。',
        author: {
          username: 'cao',
          nickname: 'huiyou',
          avatar_url: '/avatars/avatar-1.png',
        },
        replies: [
          {
            id: 2,
            content: '同意，格式问题应该交给工具。',
            author: {
              username: 'cao',
              nickname: 'huiyou',
              avatar_url: '/avatars/avatar-1.png',
            },
          },
        ],
      },
    ],
    meta: { total: 1 },
  }),
}))

function renderComments() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <CommentsSection postId="3" />
    </QueryClientProvider>,
  )
}

describe('CommentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders avatar images for comments and replies', async () => {
    renderComments()

    const avatars = await screen.findAllByAltText('huiyou 的头像')

    expect(avatars).toHaveLength(2)
    expect(avatars[0]).toHaveAttribute('src', '/avatars/avatar-1.png')
    expect(screen.queryByText('h')).not.toBeInTheDocument()
  })
})
