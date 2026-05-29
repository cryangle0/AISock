import axios from 'axios'

export interface Banner {
  id: number
  title: string
  subtitle: string | null
  image_url: string | null
  link: string | null
  sort: number
  status: number
}

export function listBanners() {
  return axios.get<Banner[]>('/api/v1/admin/banners')
}

export function createBanner(data: Partial<Banner> & { imageUrl?: string }) {
  return axios.post<{ id: number }>('/api/v1/admin/banners', data)
}

export function updateBanner(id: number, data: Partial<Banner> & { imageUrl?: string }) {
  return axios.put(`/api/v1/admin/banners/${id}`, data)
}

export function deleteBanner(id: number) {
  return axios.delete(`/api/v1/admin/banners/${id}`)
}
