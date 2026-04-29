import request from './request';
import type { DashboardData } from '../types/api';

export function getDashboard() {
  return request.get<DashboardData>('/dashboard');
}
