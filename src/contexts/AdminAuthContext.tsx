import { createContext, useContext, useEffect, useState } from 'react'
import { adminAuthService, getToken } from '@/services'
import type { AdminUser } from '@/services'

interface AdminAuthContextValue {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (nomorInduk: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
  isDosen: boolean
  ampuPraktikum: string[]
  ampuPlugs: Record<string, string[]>
  canAccessPraktikum: (slug: string | undefined) => boolean
  canAmpuPlug: (slug: string | undefined, plug: string | undefined) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(() => getToken() !== null)

  useEffect(() => {
    if (!getToken()) return
    adminAuthService
      .getUser()
      .then(setUser)
      .catch(() => adminAuthService.logout())
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (nomorInduk: string, password: string) => {
    const user = await adminAuthService.login(nomorInduk, password)
    setUser(user)
  }

  const logout = async () => {
    await adminAuthService.logout()
    setUser(null)
    window.location.href = '/login'
  }

  const hasRole = (role: string) => user?.role === role
  const isDosen = user?.role === 'dosen'
  const ampuPraktikum = user?.pengampu_praktikum ?? []
  const ampuPlugs = user?.pengampu_plug ?? {}
  const canAccessPraktikum = (slug: string | undefined) =>
    isDosen || (slug !== undefined && ampuPraktikum.includes(slug))
  const canAmpuPlug = (slug: string | undefined, plug: string | undefined) =>
    isDosen ||
    (slug !== undefined && plug !== undefined && (ampuPlugs[slug] ?? []).includes(plug))

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        isDosen,
        ampuPraktikum,
        ampuPlugs,
        canAccessPraktikum,
        canAmpuPlug,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
