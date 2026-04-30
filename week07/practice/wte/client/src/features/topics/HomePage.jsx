import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Pagination } from '../../shared/ui/Pagination'
import { EmptyState, InlineLoader } from '../../shared/ui/States'
import { fetchHotPosts, searchPosts } from '../posts/api'
import { PostStreamItem } from '../posts/PostStreamItem'
import { CreateTopicModal } from './CreateTopicModal'
import { fetchTopics } from './api'

export function HomePage() {
  const [open, setOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const query = searchParams.get('q')?.trim() ?? ''
  const topicsQuery = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
  })

  const hotPostsQuery = useQuery({
    queryKey: ['hot-posts'],
    queryFn: () => fetchHotPosts(5),
    enabled: !query,
  })

  const searchQuery = useQuery({
    queryKey: ['post-search', query, page],
    queryFn: () => searchPosts(query, page, 8),
    enabled: Boolean(query),
  })

  const visiblePosts = query ? searchQuery.data?.data ?? [] : hotPostsQuery.data ?? []
  const visibleMeta = query ? searchQuery.data?.meta : null
  const isLoading = topicsQuery.isLoading || (query ? searchQuery.isLoading : hotPostsQuery.isLoading)

  return (
    <>
      <CreateTopicModal open={open} onClose={() => setOpen(false)} />
      <div className="grid grid-cols-[minmax(0,1fr)_235px] gap-10">
        <div>
          <div className="mb-6">
            <h1 className="text-[28px] font-semibold text-black">最热</h1>
          </div>

          {isLoading ? (
            <InlineLoader label={query ? '搜索中…' : '正在加载热门帖子…'} />
          ) : visiblePosts.length ? (
            <div className="space-y-5">
              {visiblePosts.map((post) => (
                <PostStreamItem
                  key={`${post.topic_id}-${post.id}`}
                  post={post}
                  topic={topicsQuery.data?.find((topic) => topic.id === post.topic_id)}
                />
              ))}
              {query ? (
                <Pagination page={visibleMeta?.page ?? page} pageSize={visibleMeta?.page_size ?? 8} total={visibleMeta?.total ?? 0} />
              ) : null}
            </div>
          ) : (
            <EmptyState
              title={query ? '没有找到相关帖子' : '还没有热门帖子'}
              description={
                query
                  ? `没有匹配“${query}”的帖子。`
                  : '当前还没有可展示的热门帖子。'
              }
            />
          )}
        </div>

        <div className="space-y-7">
          <Button type="button" variant="accent" className="w-full justify-center text-[20px]" onClick={() => setOpen(true)}>
            创建话题
            <Plus aria-hidden="true" size={16} />
          </Button>

          <Card className="p-5">
            <h2 className="text-[18px] font-semibold text-black">话题</h2>
            {topicsQuery.data?.length ? (
              <ul className="mt-5 space-y-4 text-[18px] text-black">
                {topicsQuery.data.map((topic) => (
                  <li key={topic.id}>
                    <Link
                      to={`/topics/${topic.id}`}
                      className="focus-ring block rounded-[10px] px-4 py-3 transition-colors duration-150 hover:bg-[#f5f5f5]"
                    >
                      <div className="font-semibold">{topic.name}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-[16px] text-[#9ca3af]">暂无话题</p>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
