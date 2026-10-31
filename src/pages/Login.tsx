import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { ApiError } from "@/services";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function Login() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [nomorInduk, setNomorInduk] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(nomorInduk, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--md-sys-color-surface) p-4">
      <Card variant="outlined" className="w-full max-w-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
            Login Admin
          </h1>
          <p className="text-xs text-(--md-sys-color-on-surface-variant) mt-1">
            Silakan masuk menggunakan akun NIP atau NIM Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nomor Induk (NIP/NIM)"
            id="nomor_induk"
            type="text"
            inputMode="numeric"
            value={nomorInduk}
            onChange={(e) => setNomorInduk(e.target.value)}
            required
          />

          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button
            type="submit"
            variant="filled"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Memproses..." : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
