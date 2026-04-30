import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../shared/ui/Button'
import { Field, Input } from '../../shared/ui/Field'
import { AuthLayout } from './AuthLayout'
import { login } from './api'
import { persistAuthSession } from './authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      persistAuthSession(data)
      navigate('/', { replace: true })
    },
    onError: (error) => {
      setError('root', { message: error.message })
    },
  })

  return (
    <AuthLayout
      footer={
        <>
          还没有账号？{' '}
          <Link to="/register" className="font-semibold text-[var(--accent-deep)] underline-offset-4 hover:underline">
            立即注册
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Field label="用户名" htmlFor="username" error={errors.username?.message}>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            spellCheck={false}
            {...registerField('username', { required: '请输入用户名。' })}
          />
        </Field>

        <Field label="密码" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...registerField('password', { required: '请输入密码。' })}
          />
        </Field>

        {errors.root?.message ? (
          <p aria-live="polite" className="text-sm text-[var(--accent-deep)]">
            {errors.root.message}
          </p>
        ) : null}

        <Button type="submit" variant="accent" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? '登录中…' : '登录'}
          <ArrowRight aria-hidden="true" size={16} />
        </Button>
      </form>
    </AuthLayout>
  )
}
