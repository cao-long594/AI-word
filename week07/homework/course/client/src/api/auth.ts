import request from './request';
import type { LoginResult, UserInfo } from '../types/api';

export function loginApi(data: { username: string; password: string }) {
  return request.post<LoginResult>('/auth/login', data);
}

export function getCurrentUser() {
  return request.get<UserInfo>('/auth/me');
}
