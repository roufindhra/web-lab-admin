import { Navigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { ReactNode } from 'react'

function AccessBlocker() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-sm text-gray-500">Memuat...</div>
    </div>
  )
}

export function DosenRoute({ children }: { children: ReactNode }) {
  const { isDosen, isLoading } = useAdminAuth()

  if (isLoading) return <AccessBlocker />
  if (!isDosen) return <Navigate to="/" replace />

  return <>{children}</>
}

export function PraktikumRoute({ children }: { children: ReactNode }) {
  const { slug } = useParams()
  const { canAccessPraktikum, isLoading } = useAdminAuth()

  if (isLoading) return <AccessBlocker />
  if (!canAccessPraktikum(slug)) return <Navigate to="/praktikum" replace />

  return <>{children}</>
}
