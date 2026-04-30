import { apiRequest } from '../../shared/api/client'

export function fetchTopics() {
  return apiRequest('/api/topics')
}

export function createTopic(payload) {
  return apiRequest('/api/topics', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchTopicPosts(topicId, page = 1, pageSize = 10) {
  return fetchTopicPostsByQuery(topicId, { page, pageSize })
}

export function fetchTopicPostsByQuery(topicId, { page = 1, pageSize = 10, q = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })

  if (q.trim()) {
    params.set('q', q.trim())
  }

  return fetchPaginated(`/api/topics/${topicId}/posts?${params.toString()}`)
}

async function fetchPaginated(path) {
  const response = await fetch(path)
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to fetch posts')
  }

  return payload
}
