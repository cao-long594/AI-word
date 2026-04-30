import { Link } from 'react-router-dom'

import { Card } from '../../shared/ui/Card'

export function PostStreamItem({ post, topic }) {
  const label = topic?.name || '讨论'
  const authorName = post.author.nickname || post.author.username || '用户'
  const avatarFallback = authorName.slice(0, 1) || '?'

  return (
    <Card className="px-5 py-4">
      <Link to={`/posts/${post.id}`} className="focus-ring block">
        <div className="flex items-center gap-5">
          <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[2px] border-black bg-[#f3f4f6] text-[20px] font-semibold text-black">
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={`${authorName} 的头像`}
                className="h-full w-full object-cover"
              />
            ) : (
              avatarFallback
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[20px] font-semibold text-black">{post.title}</h2>
            <div className="mt-3 flex items-center gap-4 text-[14px] text-[#9ca3af]">
              <span className="rounded-[12px] border-[2px] border-[#9ca3af] px-4 py-1 text-[14px] leading-none text-[#8d8d93]">
                {label}
              </span>
              <span>•</span>
              <span>{post.author.nickname}</span>
              <span>•</span>
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
          <div className="shrink-0 text-[18px] font-semibold text-[#9ca3af]">
            {post.comment_count} 条评论
          </div>
        </div>
      </Link>
    </Card>
  )
}

function formatRelativeTime(value) {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minute = 60_000
  const hour = minute * 60
  const day = hour * 24

  if (diff < hour) {
    const minutes = Math.max(1, Math.floor(diff / minute))
    return `${minutes} 分钟前`
  }
  if (diff < day) {
    const hours = Math.max(1, Math.floor(diff / hour))
    return `${hours} 小时前`
  }
  return `${Math.max(1, Math.floor(diff / day))} 天前`
}
