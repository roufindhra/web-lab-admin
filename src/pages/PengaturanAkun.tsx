import { useState } from "react";
import { Button } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { adminAuthService, ApiError } from "@/services";

export default function PengaturanAkun() {
  const { user } = useAdminAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-(--md-sys-color-on-surface)">
          Pengaturan Akun
        </h1>
        <p className="text-xs text-(--md-sys-color-on-surface-variant)">
          Kelola informasi dan keamanan akun kamu.
        </p>
      </div>

      <Card variant="outlined" className="space-y-3">
        <p className="text-xs font-bold text-(--md-sys-color-on-surface)">
          Informasi Akun
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoItem label="Nama" value={user?.nama} />
          <InfoItem label="Surel" value={user?.surel ?? "-"} />
          <InfoItem label="Role" value={user?.role} />
        </div>
      </Card>

      <UbahPasswordCard />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-(--md-sys-color-on-surface-variant)">
        {label}
      </p>
      <p className="text-xs font-medium text-(--md-sys-color-on-surface)">
        {value ?? "-"}
      </p>
    </div>
  );
}

function UbahPasswordCard() {
  const [password, setPassword] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    if (passwordBaru.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (passwordBaru !== konfirmasi) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    adminAuthService
      .changePassword({
        password,
        password_baru: passwordBaru,
        password_baru_confirmation: konfirmasi,
      })
      .then(() => {
        setSuccess(true);
        setPassword("");
        setPasswordBaru("");
        setKonfirmasi("");
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal mengubah password.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <Card variant="outlined">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs font-bold text-(--md-sys-color-on-surface)">
            Ubah Password
          </p>
          <p className="text-[11px] text-(--md-sys-color-on-surface-variant)">
            Password baru minimal 8 karakter.
          </p>
        </div>

        <div className="grid gap-3 sm:max-w-sm">
          <Input
            label="Password Saat Ini"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Password Baru"
            type="password"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            required
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Password berhasil diubah.
          </p>
        )}

        <div>
          <Button type="submit" variant="filled" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
