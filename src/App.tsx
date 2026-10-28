import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DosenRoute, PraktikumRoute } from '@/components/AccessRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Students from '@/pages/Students'
import AsistenPage from '@/pages/Asisten'
import AlatLogPage from '@/pages/AlatLog'
import PeminjamanPage from '@/pages/AlatPeminjaman'
import HargaSewaPage from '@/pages/HargaSewa'
import PraktikumPage from '@/pages/Praktikum'
import PraktikumDetail from '@/pages/PraktikumDetail'
import Kurikulum from '@/pages/Kurikulum'
import KurikulumDetail from '@/pages/KurikulumDetail'
import DashboardAlat from './pages/Alat'
import AlatInventarisPage from '@/pages/AlatInventaris'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="mahasiswa" element={<Students />} />
          <Route
            path="asisten"
            element={
              <DosenRoute>
                <AsistenPage />
              </DosenRoute>
            }
          />
          <Route path="alat" element={<DashboardAlat />} />
          <Route path="alat-invent" element={<AlatInventarisPage />} />
          <Route
            path="alat-log"
            element={
              <DosenRoute>
                <AlatLogPage />
              </DosenRoute>
            }
          />
          <Route path="alat-peminjaman" element={<PeminjamanPage />} />
          <Route
            path="harga-sewa"
            element={
              <DosenRoute>
                <HargaSewaPage />
              </DosenRoute>
            }
          />
          <Route path="praktikum" element={<PraktikumPage />} />
          <Route
            path="praktikum/:slug"
            element={
              <PraktikumRoute>
                <PraktikumDetail />
              </PraktikumRoute>
            }
          />
          <Route
            path="kurikulum"
            element={
              <DosenRoute>
                <Kurikulum />
              </DosenRoute>
            }
          />
          <Route
            path="kurikulum/:slug"
            element={
              <DosenRoute>
                <KurikulumDetail />
              </DosenRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
