import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterPage } from './RegisterPage'
import { register as registerAccount } from './api'

vi.mock('./api', () => ({
  register: vi.fn().mockResolvedValue({
    token: 'token',
    user: { id: 1, username: 'user', nickname: 'Nick', avatar_url: '/avatars/avatar-4.png' },
  }),
}))

vi.mock('./authStore', () => ({
  persistAuthSession: vi.fn(),
}))

function renderRegisterPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders local avatar choices instead of an avatar URL input', () => {
    renderRegisterPage()

    expect(screen.getByText('选择头像')).toBeInTheDocument()
    expect(screen.queryByLabelText('头像链接')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('https://example.com/avatar.jpg')).not.toBeInTheDocument()

    for (const index of [1, 2, 3, 4]) {
      expect(screen.getByAltText(`头像 ${index}`)).toHaveAttribute('src', `/avatars/avatar-${index}.png`)
    }
  })

  it('submits the selected local avatar path', async () => {
    const user = userEvent.setup()
    const { container } = renderRegisterPage()

    await user.type(screen.getByLabelText('用户名'), 'tester')
    await user.type(screen.getByLabelText('昵称'), '测试用户')
    await user.type(container.querySelector('#password'), '123456')
    await user.click(container.querySelector('#avatar_url_3'))
    await user.click(screen.getByRole('button', { name: /创建账号/ }))

    await waitFor(() => {
      expect(registerAccount).toHaveBeenCalled()
      expect(registerAccount.mock.calls[0][0]).toEqual({
        username: 'tester',
        nickname: '测试用户',
        password: '123456',
        avatar_url: '/avatars/avatar-4.png',
      })
    })
  })
})
