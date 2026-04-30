import { apiRequest } from '../../shared/api/client'

export function fetchComments(postId, page = 1, pageSize = 20) {
  return fetch(`/api/posts/${postId}/comments?page=${page}&page_size=${pageSize}`).then(async (response) => {
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Failed to fetch comments')
    }
    return payload
  })
}

export function createComment(postId, payload) {
  return apiRequest(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
