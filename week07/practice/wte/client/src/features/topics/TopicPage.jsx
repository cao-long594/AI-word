import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '../../shared/ui/Button'
import { Pagination } from '../../shared/ui/Pagination'
import { EmptyState, InlineLoader } from '../../shared/ui/States'
import { PostStreamItem } from '../posts/PostStreamItem'
import { fetchTopics, fetchTopicPostsByQuery } from './api'

export function TopicPage() {
  const { topicId } = useParams()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const query = searchParams.get('q')?.trim() ?? ''

  const topicsQuery = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
  })

  const postsQuery = useQuery({
    queryKey: ['topic-posts', topicId, page, query],
    queryFn: () => fetchTopicPostsByQuery(topicId, { page, pageSize: 10, q: query }),
    enabled: Boolean(topicId),
  })

  const currentTopic = topicsQuery.data?.find((topic) => String(topic.id) === topicId)

  if (postsQuery.isLoading || topicsQuery.isLoading) {
    return <InlineLoader label="Loading topic…" />
  }

  if (!currentTopic) {
    return (
      <EmptyState
        title="Topic not found"
        description="The selected topic is unavailable or no longer exists."
        action={<Button as={Link} to="/" variant="accent">Back to Overview</Button>}
      />
    )
  }

  const posts = postsQuery.data?.data ?? []
  const meta = postsQuery.data?.meta

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold text-black">{currentTopic.name}</h1>
        </div>
        <Button as={Link} to={`/topics/${topicId}/posts/new`} variant="accent" className="text-[20px]">
          创建帖子
        </Button>
      </div>

      {posts.length ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostStreamItem key={post.id} post={post} topic={currentTopic} />
          ))}
          <Pagination page={meta?.page ?? page} pageSize={meta?.page_size ?? 10} total={meta?.total ?? 0} />
        </div>
      ) : (
        <EmptyState
          title={query ? '没有找到相关帖子' : 'No posts in this topic'}
          description={
            query
              ? `当前话题下没有匹配“${query}”的帖子。`
              : 'This desk is ready. Publish the first post to start a discussion here.'
          }
          action={
            <Button as={Link} to={`/topics/${topicId}/posts/new`} variant="accent">
              创建帖子
            </Button>
          }
        />
      )}
    </div>
  )
}
