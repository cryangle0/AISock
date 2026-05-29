import axios from 'axios'

export interface LoginReq {
  username: string
  password: string
}

export interface AdminAccount {
  id: number
  username: string
  nickname: string | null
  role: string
}

export function login(data: LoginReq) {
  return axios.post<{ token: string; account: AdminAccount }>('/api/v1/admin/auth/login', data)
}

export function getMe() {
  return axios.get<AdminAccount>('/api/v1/admin/auth/me')
}

export function logout() {
  return axios.post('/api/v1/admin/auth/logout')
}
