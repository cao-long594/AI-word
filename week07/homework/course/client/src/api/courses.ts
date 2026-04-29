import request from './request';
import type { Course, CoursePayload, PageResult } from '../types/api';

export interface CourseQuery {
  keyword?: string;
  status?: string;
  category?: string;
  sortField?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export function getCourses(params: CourseQuery) {
  return request.get<PageResult<Course>>('/courses', { params });
}

export function getCourseCategories() {
  return request.get<string[]>('/courses/categories');
}

export function createCourse(data: CoursePayload) {
  return request.post<Course>('/courses', data);
}

export function updateCourse(id: number, data: CoursePayload) {
  return request.put<Course>(`/courses/${id}`, data);
}

export function deleteCourse(id: number) {
  return request.delete<null>(`/courses/${id}`);
}

export function toggleCourseStatus(id: number) {
  return request.patch<Course>(`/courses/${id}/status`);
}
