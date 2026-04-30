import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { MarkdownPreview } from '../../shared/ui/MarkdownPreview'
import { EmptyState, InlineLoader } from '../../shared/ui/States'
import { CommentsSection } from '../comments/CommentsSection'
import { fetchPostDetail } from './api'

export function PostDetailPage() {
  const { postId } = useParams()
  const postQuery = useQuery({
    queryKey: ['post-detail', postId],
    queryFn: () => fetchPostDetail(postId),
  })

  if (postQuery.isLoading) {
    return <InlineLoader label="Loading post…" />
  }

  if (postQuery.isError) {
    return (
      <EmptyState
        title="帖子不存在"
        description="当前帖子不可用，或者已经被删除。"
      />
    )
  }

  const post = postQuery.data

  return (
    <div className="space-y-8">
      <article className="space-y-7">
        <h1 className="text-[24px] font-semibold leading-[1.5] text-[#ff3b30]">{post.title}</h1>
        <MarkdownPreview value={post.content_markdown} className="text-[18px] leading-[1.7]" />
      </article>

      <CommentsSection postId={postId} />
    </div>
  )
}
