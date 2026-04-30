import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../shared/ui/Button'
import { Field, Input } from '../../shared/ui/Field'
import { AuthLayout } from './AuthLayout'
import { register as registerAccount } from './api'
import { persistAuthSession } from './authStore'

const avatarOptions = [
  { value: '/avatars/avatar-1.png', label: '头像 1' },
  { value: '/avatars/avatar-2.png', label: '头像 2' },
  { value: '/avatars/avatar-3.png', label: '头像 3' },
  { value: '/avatars/avatar-4.png', label: '头像 4' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      username: '',
      nickname: '',
      password: '',
      avatar_url: avatarOptions[0].value,
    },
  })

  const mutation = useMutation({
    mutationFn: registerAccount,
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
          已有账号？{' '}
          <Link to="/login" className="font-semibold text-[var(--accent-deep)] underline-offset-4 hover:underline">
            去登录
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({
            ...values,
            avatar_url: values.avatar_url,
          }),
        )}
      >
        <Field label="用户名" htmlFor="username" error={errors.username?.message}>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            spellCheck={false}
            {...register('username', { required: '请输入用户名。' })}
          />
        </Field>

        <Field label="昵称" htmlFor="nickname" error={errors.nickname?.message}>
          <Input
            id="nickname"
            type="text"
            autoComplete="off"
            {...register('nickname', { required: '请输入昵称。' })}
          />
        </Field>

        <Field label="密码" htmlFor="password" hint="至少 6 位字符。" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              required: '请输入密码。',
              minLength: { value: 6, message: '至少 6 位字符。' },
            })}
          />
        </Field>

        <Field label="选择头像" htmlFor="avatar_url_0" hint="请选择一个头像。" error={errors.avatar_url?.message}>
          <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="选择头像">
            {avatarOptions.map((avatar, index) => (
              <label key={avatar.value} className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black">
                <input
                  id={`avatar_url_${index}`}
                  type="radio"
                  value={avatar.value}
                  className="peer sr-only"
                  {...register('avatar_url', { required: '请选择头像。' })}
                />
                <span className="flex aspect-square cursor-pointer items-center justify-center border-[3px] border-black bg-white p-2 peer-checked:bg-black">
                  <img
                    src={avatar.value}
                    alt={avatar.label}
                    className="h-full w-full rounded-full object-cover bg-white"
                  />
                </span>
              </label>
            ))}
          </div>
        </Field>

        {errors.root?.message ? (
          <p aria-live="polite" className="text-sm text-[var(--accent-deep)]">
            {errors.root.message}
          </p>
        ) : null}

        <Button type="submit" variant="accent" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? '注册中…' : '创建账号'}
          <ArrowRight aria-hidden="true" size={16} />
        </Button>
      </form>
    </AuthLayout>
  )
}
