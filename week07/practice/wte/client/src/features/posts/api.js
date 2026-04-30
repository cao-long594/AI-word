import { apiRequest } from '../../shared/api/client'

export function fetchPostDetail(postId) {
  return apiRequest(`/api/posts/${postId}`)
}

export function createPost(topicId, payload) {
  return apiRequest(`/api/topics/${topicId}/posts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function searchPosts(query, page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    q: query.trim(),
    page: String(page),
    page_size: String(pageSize),
  })

  return fetchPaginated(`/api/posts/search?${params.toString()}`)
}

export function fetchHotPosts(limit = 5) {
  return apiRequest(`/api/posts/hot?limit=${limit}`)
}

async function fetchPaginated(path) {
  const response = await fetch(path)
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to fetch posts')
  }

  return payload
}
