import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '../types/api';
import { clearAuth, getToken } from '../utils/auth';

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

instance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function handleAuthExpired() {
  clearAuth();
  window.location.href = '/login';
}

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  try {
    const response = await promise;
    const result = response.data;

    if (result.code === 0) {
      return result.data;
    }

    if (result.code === 401) {
      handleAuthExpired();
    }

    throw new Error(result.msg || '请求失败');
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const status = axiosError.response?.status;
    const msg = axiosError.response?.data?.msg || (error instanceof Error ? error.message : '网络请求失败');

    if (status === 401) {
      handleAuthExpired();
    }

    message.error(msg);
    throw new Error(msg, { cause: error });
  }
}

const request = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return unwrap<T>(instance.get<ApiResponse<T>>(url, config));
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return unwrap<T>(instance.post<ApiResponse<T>>(url, data, config));
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return unwrap<T>(instance.put<ApiResponse<T>>(url, data, config));
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return unwrap<T>(instance.patch<ApiResponse<T>>(url, data, config));
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return unwrap<T>(instance.delete<ApiResponse<T>>(url, config));
  },
};

export default request;
