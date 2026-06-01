import api from './api'
import type { Token, User } from '../types'

export const authService = {
  async register(email: string, password: string, full_name: string): Promise<User> {
    const { data } = await api.post<User>('/auth/register', { email, password, full_name })
    return data
  },

  async login(email: string, password: string): Promise<Token> {
    const form = new URLSearchParams({ username: email, password })
    const { data } = await api.post<Token>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },
}
