import request from './request';
import type { PageResult, Student, StudentPayload } from '../types/api';

export interface StudentQuery {
  keyword?: string;
  className?: string;
  status?: string;
  courseId?: number;
  page?: number;
  pageSize?: number;
}

export function getStudents(params: StudentQuery) {
  return request.get<PageResult<Student>>('/students', { params });
}

export function getStudentClasses() {
  return request.get<string[]>('/students/classes');
}

export function createStudent(data: StudentPayload) {
  return request.post<Student>('/students', data);
}

export function updateStudent(id: number, data: StudentPayload) {
  return request.put<Student>(`/students/${id}`, data);
}

export function deleteStudent(id: number) {
  return request.delete<null>(`/students/${id}`);
}
