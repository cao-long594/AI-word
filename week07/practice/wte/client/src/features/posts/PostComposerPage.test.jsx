import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PostComposerPage } from './PostComposerPage'

vi.mock('../topics/api', () => ({
  fetchTopics: vi.fn().mockResolvedValue([]),
}))

vi.mock('./api', () => ({
  createPost: vi.fn(),
}))

function renderComposer() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/topics/2/posts/new']}>
        <Routes>
          <Route path="/topics/:topicId/posts/new" element={<PostComposerPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PostComposerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the editor without the title preview heading', async () => {
    renderComposer()

    expect(await screen.findByLabelText('加粗')).toBeInTheDocument()
    expect(screen.queryByText('标题预览')).not.toBeInTheDocument()
  })

  it('updates the markdown preview from the body textarea', async () => {
    const user = userEvent.setup()
    renderComposer()

    const body = await screen.findByPlaceholderText('请输入正文内容...')
    await user.type(body, '**预览文本**')

    expect(await screen.findByText('预览文本')).toBeInTheDocument()
  })

  it('wraps selected text in bold markdown', async () => {
    const user = userEvent.setup()
    renderComposer()

    const body = await screen.findByPlaceholderText('请输入正文内容...')
    await user.type(body, '需要加粗')
    body.setSelectionRange(0, 4)
    await user.click(screen.getByLabelText('加粗'))

    await waitFor(() => {
      expect(body).toHaveValue('**需要加粗**')
      expect(body.selectionStart).toBe(2)
      expect(body.selectionEnd).toBe(6)
    })
  })

  it('inserts link, image, and table templates without a selection', async () => {
    const user = userEvent.setup()
    renderComposer()

    const body = await screen.findByPlaceholderText('请输入正文内容...')
    await user.click(screen.getByLabelText('链接'))
    expect(body).toHaveValue('[链接文本](https://example.com)')

    await user.click(screen.getByLabelText('图片'))
    expect(body.value).toContain('![图片描述](https://example.com/image.png)')

    await user.click(screen.getByLabelText('表格'))
    expect(body.value).toContain('| 标题 | 内容 |')
    expect(body.value).toContain('| --- | --- |')
  })

  it('clears the body and updates character count', async () => {
    const user = userEvent.setup()
    renderComposer()

    const body = await screen.findByPlaceholderText('请输入正文内容...')
    await user.type(body, '正文内容')
    expect(screen.getByText('字符数: 4')).toBeInTheDocument()

    await user.click(screen.getByLabelText('清空'))

    await waitFor(() => {
      expect(body).toHaveValue('')
    })
    expect(screen.getByText('字符数: 0')).toBeInTheDocument()
  })
})
