import request from './request';

export function getSummary() {
  return request.get<{ content: string }>('/summary');
}
