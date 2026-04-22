import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res.code !== 0) {
      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    return res.data
  },
  (error) => {
    const msg =
      error.response?.data?.msg ||
      error.message ||
      '网络请求失败'

    return Promise.reject(new Error(msg))
  }
)

export default request