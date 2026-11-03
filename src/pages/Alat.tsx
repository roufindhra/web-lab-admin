import React, { useState } from "react";
import { Button } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";

import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  alatTokenService,
  mahasiswaService,
  ApiError,
  ALAT_PERMISSIONS,
  ALAT_PERMISSION_LABELS,
  ALAT_TOKEN_DURATIONS,
  type AlatPermission,
  type AlatToken,
  type AlatTokenDuration,
} from "@/services";

function formatWaktu(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusLabel: Record<string, string> = {
  belum_diklaim: "Belum diklaim",
  aktif: "Aktif",
  kadaluarsa: "Kadaluarsa",
  dicabut: "Dicabut",
};

export default function DashboardAlat() {
  const { isDosen, alatPermissions, alatTokenExpiresAt, claimAlatToken } =
    useAdminAuth();

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokens, setTokens] = useState<AlatToken[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const loadTokens = () => {
    return alatTokenService
      .list()
      .then((response) => {
        setTokens(response.data.filter((t) => t.status !== "dicabut"));
        setListError(null);
      })
      .catch((err) => {
        setListError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat daftar token.",
        );
      });
  };

  React.useEffect(() => {
    if (isDosen) {
      loadTokens();
    }
  }, [isDosen]);

  const handleRevoke = (id: number) => {
    alatTokenService
      .revoke(id)
      .then(loadTokens)
      .catch((err) => {
        setListError(
          err instanceof ApiError ? err.message : "Gagal mencabut token.",
        );
      });
  };

  const hasActivePermission =
    alatPermissions.length > 0 && alatTokenExpiresAt !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-(--md-sys-color-on-surface)">
          Manajemen Alat Laboratorium
        </h1>
        <p className="text-xs text-(--md-sys-color-on-surface-variant)">
          Otorisasi akses edit sementara lewat token. Tabel alat ada di menu{" "}
          <a
            href="/alat-invent"
            className="underline hover:text-(--md-sys-color-on-surface)"
          >
            Inventaris Alat
          </a>
          .
        </p>
      </div>

      <Card variant="filled">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-(--md-sys-color-on-surface)">
              Otorisasi Akses Edit
            </p>
            <p className="text-[11px] text-(--md-sys-color-on-surface-variant)">
              {isDosen
                ? "Terbitkan kode token untuk memberi asisten akses edit data alat sementara."
                : "Masukkan kode token dari dosen untuk mengaktifkan akses edit data alat."}
            </p>
          </div>
          {isDosen ? (
            <Button variant="filled" onClick={() => setIsTokenModalOpen(true)}>
              + Generate Token Admin
            </Button>
          ) : (
            <ClaimTokenForm onClaimed={claimAlatToken} />
          )}
        </div>
      </Card>

      <Card
        variant="outlined"
        className="flex items-center justify-between gap-3"
      >
        {isDosen ? (
          <p className="text-xs text-(--md-sys-color-on-surface-variant)">
            Kamu memiliki akses penuh sebagai dosen.
          </p>
        ) : hasActivePermission ? (
          <p className="text-xs text-(--md-sys-color-on-surface-variant)">
            Izin edit:{" "}
            {alatPermissions
              .map((permission) => ALAT_PERMISSION_LABELS[permission])
              .join(", ")}{" "}
            — berlaku hingga {formatWaktu(alatTokenExpiresAt)}
          </p>
        ) : (
          <p className="text-xs text-(--md-sys-color-on-surface-variant)">
            Belum ada izin edit aktif.
          </p>
        )}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isDosen || hasActivePermission
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isDosen || hasActivePermission ? "Aktif" : "Nonaktif"}
        </span>
      </Card>

      {isDosen && (
        <Card variant="outlined" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-(--md-sys-color-on-surface)">
              Daftar Token Diterbitkan
            </p>
            <Button
              variant="text"
              onClick={loadTokens}
              className="px-2 py-1 text-[11px]"
            >
              Muat ulang
            </Button>
          </div>

          {listError && <p className="text-xs text-red-600">{listError}</p>}

          {tokens.length === 0 && !listError ? (
            <p className="text-xs text-(--md-sys-color-on-surface-variant)">
              Belum ada token yang diterbitkan.
            </p>
          ) : (
            <ul className="space-y-2">
              {tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex items-center justify-between gap-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) p-2"
                >
                  <div className="min-w-0 text-[11px]">
                    <p className="font-mono font-bold text-(--md-sys-color-on-surface) select-all">
                      {token.token}
                    </p>
                    <p className="truncate font-semibold text-(--md-sys-color-on-surface)">
                      {token.mahasiswa_nama}{" "}
                      <span className="font-mono text-(--md-sys-color-on-surface-variant)">
                        {token.mahasiswa_nim}
                      </span>
                    </p>
                    <p className="truncate text-(--md-sys-color-on-surface-variant)">
                      {token.permissions
                        .map((permission) => ALAT_PERMISSION_LABELS[permission])
                        .join(", ")}
                    </p>
                    <p className="text-(--md-sys-color-on-surface-variant)">
                      {statusLabel[token.status]} · habis{" "}
                      {token.expires_at ? formatWaktu(token.expires_at) : "-"}
                    </p>
                  </div>
                  {token.status === "aktif" ||
                  token.status === "belum_diklaim" ? (
                    <Button
                      variant="text"
                      onClick={() => handleRevoke(token.id)}
                      className="shrink-0 px-2 py-1 text-[11px] text-red-600 hover:bg-red-500/10"
                    >
                      Cabut
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {isTokenModalOpen && (
        <TokenAdminDialog
          onClose={() => setIsTokenModalOpen(false)}
          onGenerated={loadTokens}
        />
      )}
    </div>
  );
}

function ClaimTokenForm({
  onClaimed,
}: {
  onClaimed: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim() || isClaiming) return;

    setIsClaiming(true);
    setError(null);
    onClaimed(code.trim())
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal mengklaim token.",
        );
      })
      .finally(() => setIsClaiming(false));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Kode Token..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-40 text-xs"
        />
        <Button
          type="submit"
          variant="filled"
          className="text-xs"
          disabled={isClaiming}
        >
          {isClaiming ? "Memeriksa..." : "Klaim"}
        </Button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </form>
  );
}

function TokenAdminDialog({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [asistenList, setAsistenList] = useState<
    { id: number; nama: string; nim: number }[]
  >([]);
  const [mahasiswaId, setMahasiswaId] = useState("");
  const [permissions, setPermissions] = useState<AlatPermission[]>([]);
  const [duration, setDuration] = useState<AlatTokenDuration>("2_hours");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    mahasiswaService
      .getAll({ role: "asisten", perPage: 100 })
      .then((response) =>
        setAsistenList(
          response.data.map((student) => ({
            id: student.id,
            nama: student.nama,
            nim: student.nim,
          })),
        ),
      )
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat daftar asisten.",
        );
      });
  }, []);

  const togglePermission = (permission: AlatPermission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission],
    );
  };

  const handleGenerate = () => {
    if (!mahasiswaId || permissions.length === 0) {
      setError("Pilih asisten penerima dan minimal satu permission.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    alatTokenService
      .generate({
        mahasiswa_id: Number(mahasiswaId),
        permissions,
        duration,
      })
      .then(() => {
        setPermissions([]);
        onGenerated();
        onClose();
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal membuat token.",
        );
      })
      .finally(() => setIsGenerating(false));
  };

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Otorisasi Token Akses Admin"
      className="max-w-md"
    >
      <div className="space-y-4">
        <Select
          label="1. Penerima (Asisten)"
          options={[
            { value: "", label: "Pilih mahasiswa asisten..." },
            ...asistenList.map((asisten) => ({
              value: String(asisten.id),
              label: `${asisten.nama} (${asisten.nim})`,
            })),
          ]}
          value={mahasiswaId}
          onValueChange={setMahasiswaId}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-(--md-sys-color-on-surface)">
            2. Dukungan Permission (Hak Akses)
          </label>
          <div className="space-y-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-3">
            {ALAT_PERMISSIONS.map((permission) => (
              <Checkbox
                key={permission}
                label={ALAT_PERMISSION_LABELS[permission]}
                checked={permissions.includes(permission)}
                onCheckedChange={() => togglePermission(permission)}
              />
            ))}
          </div>
        </div>

        <Select
          label="3. Masa Berlaku"
          options={ALAT_TOKEN_DURATIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={duration}
          onValueChange={(val) => setDuration(val as AlatTokenDuration)}
        />

        <Button
          variant="filled"
          className="w-full"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "Menerbitkan..." : "Generate Kode Token"}
        </Button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Dialog>
  );
}
