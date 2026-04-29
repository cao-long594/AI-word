export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar?: string;
  created_at?: string;
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  instructor: string;
  cover?: string;
  category: string;
  status: 'published' | 'draft';
  student_count: number;
  lesson_count: number;
  created_at: string;
  updated_at: string;
}

export interface CoursePayload {
  name: string;
  description?: string;
  instructor?: string;
  category?: string;
  status?: 'published' | 'draft';
  lesson_count?: number;
}

export interface Student {
  id: number;
  name: string;
  student_no: string;
  class_name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  course_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface StudentPayload {
  name: string;
  student_no: string;
  class_name?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  course_ids?: number[];
}

export interface DashboardData {
  stats: {
    totalCourses: number;
    publishedCourses: number;
    totalStudents: number;
    activeStudents: number;
  };
  charts: {
    enrollment: Array<{ name: string; value: number }>;
    activity: Array<{ date: string; label: string; students: number; duration: number }>;
    statusDist: Array<{ name: string; value: number }>;
    categoryDist: Array<{ name: string; value: number }>;
  };
}
