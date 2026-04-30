import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { useAuthBootstrap, useAuthStore } from '../features/auth/authStore'
import { HomePage } from '../features/topics/HomePage'
import { TopicPage } from '../features/topics/TopicPage'
import { PostComposerPage } from '../features/posts/PostComposerPage'
import { PostDetailPage } from '../features/posts/PostDetailPage'
import { AppShell } from '../shared/ui/AppShell'
import { FullPageLoader } from '../shared/ui/States'

function ProtectedLayout() {
  const { isAuthenticated, bootstrapped } = useAuthBootstrap()

  if (!bootstrapped) {
    return <FullPageLoader label="Loading community…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function GuestOnly({ children }) {
  const { isAuthenticated, bootstrapped } = useAuthBootstrap()

  if (!bootstrapped) {
    return <FullPageLoader label="Loading community…" />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export const AppRouter = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestOnly>
        <RegisterPage />
      </GuestOnly>
    ),
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'topics/:topicId', element: <TopicPage /> },
      { path: 'topics/:topicId/posts/new', element: <PostComposerPage /> },
      { path: 'posts/:postId', element: <PostDetailPage /> },
    ],
  },
])
