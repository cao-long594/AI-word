import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Textarea } from '../../shared/ui/Field'
import { EmptyState, InlineLoader } from '../../shared/ui/States'
import { createComment, fetchComments } from './api'

export function CommentsSection({ postId }) {
  const [replyTo, setReplyTo] = useState(null)
  const queryClient = useQueryClient()
  const commentsQuery = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => fetchComments(postId, 1, 20),
  })

  const rootForm = useForm({
    defaultValues: { content: '' },
  })

  const mutation = useMutation({
    mutationFn: (payload) => createComment(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post-detail', postId] })
      rootForm.reset()
      setReplyTo(null)
    },
    onError: (error) => {
      rootForm.setError('root', { message: error.message })
    },
  })

  return (
    <div className="space-y-5">
      <section className="space-y-6">
        <form
          className="w-full space-y-4"
          onSubmit={rootForm.handleSubmit((values) => mutation.mutate({ content: values.content }))}
        >
          <div className="w-full border-[3px] border-black bg-white px-6 py-5">
            <Textarea
              id="root-comment"
              aria-label="Add comment"
              autoComplete="off"
              placeholder="评论帖子 ..."
              className="min-h-[180px] w-full resize-none border-0 px-0 py-0 focus-visible:outline-none"
              {...rootForm.register('content', { required: '请输入评论内容' })}
            />
          </div>
          {rootForm.formState.errors.content?.message ? (
            <p aria-live="polite" className="text-sm text-[var(--accent-deep)]">
              {rootForm.formState.errors.content.message}
            </p>
          ) : null}
          {rootForm.formState.errors.root?.message ? (
            <p aria-live="polite" className="text-sm text-[var(--accent-deep)]">
              {rootForm.formState.errors.root.message}
            </p>
          ) : null}
          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              className="rounded-[16px] px-12 py-4 text-[20px]"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? '评论中…' : '评论'}
            </Button>
          </div>
        </form>

        <h2 className="text-[24px] font-semibold text-black">共 {commentsQuery.data?.meta?.total ?? 0} 条评论</h2>
      </section>

      {commentsQuery.isLoading ? (
        <InlineLoader label="正在加载评论..." />
      ) : commentsQuery.data?.data?.length ? (
        <div className="space-y-4">
          {commentsQuery.data.data.map((item) => (
            <CommentItem
              key={item.id}
              item={item}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onReply={(payload) => mutation.mutate(payload)}
              pending={mutation.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="还没有评论" description="这篇帖子暂时还没有人回复，来写下第一条评论吧。" />
      )}
    </div>
  )
}

function CommentItem({ item, replyTo, setReplyTo, onReply, pending, level = 0 }) {
  const isReplying = replyTo === item.id
  const authorName = item.author.nickname || item.author.username || '用户'
  const avatarFallback = authorName.slice(0, 1) || '?'
  const replyForm = useForm({
    defaultValues: { content: '' },
  })

  useEffect(() => {
    if (!isReplying) {
      replyForm.reset()
    }
  }, [isReplying, replyForm])

  return (
    <Card className={`p-6 ${level > 0 ? 'ml-10' : ''}`}>
      <div className="flex gap-6">
        <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[2px] border-black bg-[#f3f4f6] text-[24px] font-semibold">
          {item.author.avatar_url ? (
            <img
              src={item.author.avatar_url}
              alt={`${authorName} 的头像`}
              className="h-full w-full object-cover"
            />
          ) : (
            avatarFallback
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-semibold text-black">{item.author.nickname}</p>
          <p className="mt-1 break-words text-[18px] leading-8 text-black">{item.content}</p>
          <button
            type="button"
            className="focus-ring mt-3 text-[16px] font-semibold text-black underline-offset-4 hover:underline"
            onClick={() => setReplyTo(isReplying ? null : item.id)}
          >
            评论
          </button>

          {isReplying ? (
            <form
              className="mt-5 w-full"
              onSubmit={replyForm.handleSubmit((values) =>
                onReply({
                  parent_id: item.id,
                  content: values.content,
                }),
              )}
            >
              <div className="w-full border-[3px] border-black bg-white px-6 py-5">
                <Textarea
                  id={`reply-${item.id}`}
                  aria-label="Reply"
                  autoComplete="off"
                  placeholder="回复这条评论 ..."
                  className="min-h-[120px] w-full resize-none border-0 px-0 py-0 focus-visible:outline-none"
                  {...replyForm.register('content', { required: '请输入回复内容' })}
                />
              </div>
              {replyForm.formState.errors.content?.message ? (
                <p aria-live="polite" className="mt-2 text-sm text-[var(--accent-deep)]">
                  {replyForm.formState.errors.content.message}
                </p>
              ) : null}
              <div className="mt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setReplyTo(null)}>
                  取消
                </Button>
                <Button type="submit" variant="primary" disabled={pending}>
                  {pending ? '回复中…' : '回复'}
                </Button>
              </div>
            </form>
          ) : null}

          {item.replies?.length ? (
            <div className="mt-5 space-y-3">
              {item.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  item={reply}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  onReply={onReply}
                  pending={pending}
                  level={level + 1}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
