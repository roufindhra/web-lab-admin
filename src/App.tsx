import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Students from '@/pages/Students'
import AlatInventPage from '@/pages/AlatInventaris'
import AlatLogPage from '@/pages/AlatLog'
import PeminjamanPage from '@/pages/AlatPeminjaman'
import HargaSewaPage from '@/pages/HargaSewa'
import PraktikumPage from '@/pages/Praktikum'
import PraktikumDetail from '@/pages/PraktikumDetail'
import Kurikulum from '@/pages/Kurikulum'
import KurikulumDetail from '@/pages/KurikulumDetail'
import PengaturanAkun from '@/pages/PengaturanAkun'
import DashboardAlat from './pages/Alat'

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
          <Route path="alat" element={<DashboardAlat />} />
          <Route path="alat-invent" element={<AlatInventPage />} />
          <Route path="alat-log" element={<AlatLogPage />} />
          <Route path="alat-peminjaman" element={<PeminjamanPage />} />
          <Route path="harga-sewa" element={<HargaSewaPage />} />
          <Route path="praktikum" element={<PraktikumPage />} />
          <Route path="praktikum/:slug" element={<PraktikumDetail />} />
          <Route path="kurikulum" element={<Kurikulum />} />
          <Route path="kurikulum/:slug" element={<KurikulumDetail />} />
          <Route path="pengaturan-akun" element={<PengaturanAkun />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
