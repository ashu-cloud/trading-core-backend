import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const queryClient = useQueryClient()

  // On mount, fetch session (GET /auth/me or fallback wallet) to hydrate context
  const { refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      // Try /auth/me first
      try {
        const res = await api.get('/auth/me')
        return res.data
      } catch (e) {
        // fallback: wallet balance could be used as an auth-probe
        const res = await api.get('/wallet/balance')
        return { balance: res.data?.balance }
      }
    },
    onSuccess: (data) => {
      setUser(data ?? null)
    },
    onError: () => {
      setUser(null)
    },
    staleTime: 0,
    retry: false,
    enabled: true
  })

  // Expose login/logout helpers. Logout should call backend to clear cookie.
  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // ignore
    }
    setUser(null)
    queryClient.clear()
    window.location.href = '/auth'
  }

  const value = {
    user,
    setUser,
    refetchAuth: refetch,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
