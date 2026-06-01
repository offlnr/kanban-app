import api from './api'
import type { User } from '../types'

export const usersService = {
  async searchByEmail(email: string): Promise<User> {
    const { data } = await api.get<User>('/users/search', { params: { email } })
    return data
  },
}
