import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { Button } from '../../shared/ui/Button'
import { Field, Input, Textarea } from '../../shared/ui/Field'
import { Modal } from '../../shared/ui/Modal'
import { createTopic } from './api'

export function CreateTopicModal({ open, onClose }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const mutation = useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      reset()
      onClose()
    },
    onError: (error) => {
      setError('root', { message: error.message })
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="创建话题">
      <form className="space-y-5" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Field label="名称" htmlFor="topic-name" error={errors.name?.message}>
          <Input
            id="topic-name"
            type="text"
            autoComplete="off"
            placeholder="请输入话题名称"
            {...register('name', { required: '请输入话题名称' })}
          />
        </Field>

        <Field label="描述" htmlFor="topic-description" error={errors.description?.message}>
          <Textarea
            id="topic-description"
            autoComplete="off"
            placeholder="请输入话题描述 ..."
            className="min-h-[120px]"
            {...register('description', { required: '请输入话题描述' })}
          />
        </Field>

        {errors.root?.message ? (
          <p aria-live="polite" className="text-sm text-[var(--accent-deep)]">
            {errors.root.message}
          </p>
        ) : null}

        <div className="flex justify-center gap-7 pt-2">
          <Button type="button" variant="ghost" className="rounded-[16px] bg-[#d5dbe4] px-10 py-3" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" variant="primary" className="rounded-[16px] px-10 py-3" disabled={mutation.isPending}>
            {mutation.isPending ? '确定中…' : '确定'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
