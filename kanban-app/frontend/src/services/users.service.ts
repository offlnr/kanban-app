import api from './api'
import type { User } from '../types'

export interface ProfileUpdate {
  full_name?: string
  bio?: string | null
  avatar_url?: string | null
  current_password?: string
  new_password?: string
}

export const usersService = {
  async searchByEmail(email: string): Promise<User> {
    const { data } = await api.get<User>('/users/search', { params: { email } })
    return data
  },

  async updateProfile(payload: ProfileUpdate): Promise<User> {
    const { data } = await api.patch<User>('/users/me', payload)
    return data
  },

  async removeAvatar(): Promise<User> {
    const { data } = await api.delete<User>('/users/me/avatar')
    return data
  },
}
