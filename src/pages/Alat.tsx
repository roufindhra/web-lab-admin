import React, { useState } from "react";
import { Button } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";

import AlatFormModal from "@/components/modals/AlatFormModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import KondisiDetailModal from "@/components/modals/KondisiDetailModal";
import { type Alat } from "@/services";

export default function DashboardAlat() {
  const [currentRole, setCurrentRole] = useState<"super_admin" | "admin">(
    "super_admin",
  );
  const [activeTab, setActiveTab] = useState<
    "inventaris" | "peminjaman" | "riwayat"
  >("inventaris");

  const [selectedAlat, setSelectedAlat] = useState<Alat | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isKondisiModalOpen, setIsKondisiModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const [permEditStatus, setPermEditStatus] = useState(false);
  const [permEditKondisi, setPermEditKondisi] = useState(false);
  const [permCrudInventaris, setPermCrudInventaris] = useState(false);
  const [tokenDuration, setTokenDuration] = useState("2_hours");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const [inputToken, setInputToken] = useState("");
  const [adminPermissions, setAdminPermissions] = useState<{
    editStatus: boolean;
    editKondisi: boolean;
    crudInventaris: boolean;
  } | null>(null);

  const [dataAlat, setDataAlat] = useState<Alat[]>([
  {
    id: 1,
    inventaris: "INV/SGG/2026/001",
    nama_alat: "Total Station Hi-Target HTS-420R",
    merk: "Hi-Target",
    tipe: "HTS-420R",
    serial_number: "SN-982138",
    lokasi_penyimpanan: "Lemari A1 Lab SGG",
    jumlah: 5,
    ketersediaan: "tersedia",
    kondisi_ringkas: {
      baik: 5,
      rusak_ringan: 0,
      rusak_berat: 0,
      maintenance: 0,
    },
    kondisi: [
      {
        status: "baik",
        jumlah: 5,
        catatan: [{ komponen: "Lensa", keterangan: "Bersih & Kalibrasi Aktif" }],
      },
    ],
  },
  {
    id: 2,
    inventaris: "INV/SGG/2025/014",
    nama_alat: "Receiver GNSS RTK Emlid Reach RS2+",
    merk: "Emlid",
    tipe: "Reach RS2+",
    serial_number: "SN-441029",
    lokasi_penyimpanan: "Lemari B2 Lab SGG",
    jumlah: 2,
    ketersediaan: "perbaikan",
    kondisi_ringkas: {
      baik: 0,
      rusak_ringan: 2,
      rusak_berat: 0,
      maintenance: 0,
    },
    kondisi: [
      {
        status: "rusak_ringan",
        jumlah: 2,
        catatan: [{ komponen: "Baterai Pole", keterangan: "Drop Fast Charge" }],
      },
    ],
  },
]);

  const handleOpenTambah = () => {
    setSelectedAlat(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (alat: Alat) => {
    setSelectedAlat(alat);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (alat: Alat) => {
    setSelectedAlat(alat);
    setIsDeleteModalOpen(true);
  };

  const handleOpenKondisi = (alat: Alat) => {
    setSelectedAlat(alat);
    setIsKondisiModalOpen(true);
  };

  const handleGenerateToken = () => {
    const mockToken =
      "SGG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedToken(mockToken);
  };

  const handleClaimToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken) return;
    setAdminPermissions({
      editStatus: true,
      editKondisi: true,
      crudInventaris: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--md-sys-color-primary)">
            Simulasi Hak Akses
          </p>
          <p className="text-xs font-semibold text-(--md-sys-color-on-surface)">
            Role Aktif:{" "}
            <span className="capitalize">{currentRole.replace("_", " ")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={currentRole === "super_admin" ? "filled" : "outlined"}
            onClick={() => setCurrentRole("super_admin")}
          >
            Super Admin
          </Button>
          <Button
            size="sm"
            variant={currentRole === "admin" ? "filled" : "outlined"}
            onClick={() => setCurrentRole("admin")}
          >
            Admin
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-(--md-sys-color-on-surface)">
            Manajemen Alat Laboratorium
          </h1>
          <p className="text-xs text-gray-500">
            Kelola inventarisasi, pengecekan kondisi, dan otorisasi akses
            sementara.
          </p>
        </div>

        {currentRole === "super_admin" && (
          <Button variant="filled" onClick={() => setIsTokenModalOpen(true)}>
            + Generate Token Admin
          </Button>
        )}
      </div>

      {currentRole === "admin" && (
        <Card variant="outlined" className="bg-amber-50/20 border-amber-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold text-(--md-sys-color-on-surface)">
                Izin Edit Memerlukan Token Otorisasi
              </p>
              <p className="text-[11px] text-gray-500">
                Masukkan kode token dari Super Admin untuk mengaktifkan akses
                edit data alat.
              </p>
            </div>
            <form onSubmit={handleClaimToken} className="flex gap-2">
              <Input
                placeholder="Kode Token..."
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-40 text-xs"
              />
              <Button type="submit" variant="filled" className="text-xs">
                Klaim
              </Button>
            </form>
          </div>
        </Card>
      )}

      <div className="border-b border-(--md-sys-color-outline-variant)">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("inventaris")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === "inventaris"
                ? "border-(--md-sys-color-primary) text-(--md-sys-color-primary)"
                : "border-transparent text-gray-400 hover:text-(--md-sys-color-on-surface)"
            }`}
          >
            Inventaris Alat
          </button>
          <button
            onClick={() => setActiveTab("peminjaman")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === "peminjaman"
                ? "border-(--md-sys-color-primary) text-(--md-sys-color-primary)"
                : "border-transparent text-gray-400 hover:text-(--md-sys-color-on-surface)"
            }`}
          >
            Peminjaman Aktif
          </button>
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === "riwayat"
                ? "border-(--md-sys-color-primary) text-(--md-sys-color-primary)"
                : "border-transparent text-gray-400 hover:text-(--md-sys-color-on-surface)"
            }`}
          >
            Riwayat & Log
          </button>
        </nav>
      </div>

      {activeTab === "inventaris" && (
        <Card variant="outlined" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-(--md-sys-color-on-surface)">
              Daftar Alat Terdaftar
            </h3>
            <Button
              variant="outlined"
              size="sm"
              onClick={handleOpenTambah}
              disabled={
                currentRole === "admin" && !adminPermissions?.crudInventaris
              }
            >
              + Tambah Unit Baru
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-(--md-sys-color-outline-variant)] bg-(--md-sys-color-surface-container-high) text-gray-600">
                <tr>
                  <th className="p-3">No. Inventaris</th>
                  <th className="p-3">Nama Alat</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--md-sys-color-outline-variant)">
                {dataAlat.map((alat) => (
                  <tr key={alat.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-mono font-bold">
                      {alat.inventaris}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-(--md-sys-color-on-surface)">
                        {alat.nama_alat}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {alat.merk} · {alat.tipe} ({alat.jumlah} Unit)
                      </p>
                    </td>
                    <td className="p-3 text-gray-600">
                      {alat.lokasi_penyimpanan}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          alat.ketersediaan === "tersedia"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {alat.ketersediaan}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Button
                        variant="text"
                        onClick={() => handleOpenKondisi(alat)}
                        className="px-2 py-1 text-xs"
                      >
                        Detail Kondisi
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenEdit(alat)}
                        disabled={
                          currentRole === "admin" &&
                          !adminPermissions?.editKondisi
                        }
                        className="px-2 py-1 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => handleOpenDelete(alat)}
                        disabled={
                          currentRole === "admin" &&
                          !adminPermissions?.crudInventaris
                        }
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isFormModalOpen && (
        <AlatFormModal
          alat={selectedAlat}
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            setIsFormModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && selectedAlat && (
        <DeleteConfirmModal
          alat={selectedAlat}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={() => {
            setIsDeleteModalOpen(false);
          }}
        />
      )}

      {isKondisiModalOpen && selectedAlat && (
        <KondisiDetailModal
          alat={selectedAlat}
          isOpen={isKondisiModalOpen}
          onClose={() => setIsKondisiModalOpen(false)}
        />
      )}

      {isTokenModalOpen && (
        <Dialog
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          title="Otorisasi Token Akses Admin"
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">
                1. DUKUNGAN PERMISSION (HAK AKSES)
              </label>
              <div className="space-y-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-3">
                <Checkbox
                  label="Edit Status Ketersediaan Alat"
                  checked={permEditStatus}
                  onCheckedChange={(val) => setPermEditStatus(Boolean(val))}
                />
                <Checkbox
                  label="Edit Catatan Kondisi Komponen"
                  checked={permEditKondisi}
                  onCheckedChange={(val) => setPermEditKondisi(Boolean(val))}
                />
                <Checkbox
                  label="Tambah & Hapus Inventarisasi"
                  checked={permCrudInventaris}
                  onCheckedChange={(val) => setPermCrudInventaris(Boolean(val))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">
                2. MASA BERLAKU
              </label>
              <Select
                options={[
                  { value: "30_mins", label: "30 Menit" },
                  { value: "2_hours", label: "2 Jam" },
                  { value: "1_day", label: "1 Hari (24 Jam)" },
                ]}
                value={tokenDuration}
                onValueChange={(val) => setTokenDuration(val)}
              />
            </div>

            <Button
              variant="filled"
              className="w-full"
              onClick={handleGenerateToken}
            >
              Generate Kode Token
            </Button>

            {generatedToken && (
              <div className="rounded-(--md-sys-shape-corner-medium) border border-emerald-300 bg-emerald-50 p-3 text-center">
                <p className="text-[11px] text-emerald-700">
                  Kode Token Berhasil Diterbitkan:
                </p>
                <p className="font-mono text-xl font-bold text-emerald-900 select-all my-1">
                  {generatedToken}
                </p>
                <p className="text-[10px] text-emerald-600">
                  Salin dan berikan kepada Admin yang sedang bertugas.
                </p>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
