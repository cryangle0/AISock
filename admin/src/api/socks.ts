import axios from 'axios'

export interface SockModel {
  id: number
  code: string
  name: string
  thumb_url: string | null
  svg_url: string | null
  mask_url: string | null
  lineart_url: string | null
  print_area_px: number | null
  phys_width_mm: number | null
  phys_height_mm: number | null
  recommend_dpi: number | null
  craft: string | null
  min_order: number
  unit_price: number
  sort: number
  status: number
}

export function listSocks() {
  return axios.get<SockModel[]>('/api/v1/admin/socks')
}

export function createSock(data: Partial<SockModel>) {
  return axios.post<{ id: number }>('/api/v1/admin/socks', data)
}

export function updateSock(id: number, data: Partial<SockModel>) {
  return axios.put(`/api/v1/admin/socks/${id}`, data)
}

export function deleteSock(id: number) {
  return axios.delete(`/api/v1/admin/socks/${id}`)
}
