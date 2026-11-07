import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { getFormErrorMessages } from "@/utils/errors";
import { cn } from "@/utils/cn";

interface UnderlineFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: ReactNode;
  hasError?: boolean;
}

function UnderlineField({
  id,
  label,
  icon,
  hasError = false,
  type = "text",
  className,
  ...props
}: UnderlineFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-3 border-b pb-2.5 transition-colors",
          hasError
            ? "border-red-500 focus-within:border-red-500"
            : "border-(--md-sys-color-outline) focus-within:border-(--login-accent)",
        )}
      >
        <span
          aria-hidden="true"
          className="shrink-0 text-(--md-sys-color-on-surface-variant) [&>svg]:h-5 [&>svg]:w-5"
        >
          {icon}
        </span>
        <input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          className={cn(
            "w-full min-w-0 bg-transparent text-sm text-(--md-sys-color-on-surface) placeholder:text-(--md-sys-color-on-surface-variant) focus:outline-none",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="shrink-0 cursor-pointer text-(--md-sys-color-on-surface-variant) transition-colors hover:text-(--md-sys-color-on-surface)"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [nomorInduk, setNomorInduk] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(nomorInduk, password);
      navigate("/");
    } catch (err) {
      // Error validasi (422) tampil inline; error lain ditangani modal global.
      const messages = getFormErrorMessages(err);
      setError(messages.length > 0 ? messages.join(" ") : null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page flex min-h-screen flex-col bg-(--md-sys-color-surface) text-(--md-sys-color-on-surface)">
      <div className="grid flex-1 lg:grid-cols-[1.6fr_1fr]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="login-brand-panel absolute inset-0" aria-hidden="true" />
          <div className="login-grid absolute inset-0" aria-hidden="true" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center">
              <img src="/public/favicon.svg" /> 
            </div>
            <span className="text-sm font-semibold uppercase text-white/90">
              Laboratorium Survei Geodesi dan Geometri
            </span>
          </div>

          <div className="relative z-10 max-w-lg space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Selamat Datang di Laboratorium Survei Geodesi dan Geometri
            </h2>
            <p className="text-sm leading-relaxed text-white/80">
              Sistem administrasi untuk pengelolaan inventaris alat, praktikum,
              asisten, dan praktikan dalam satu tempat.
            </p>
          </div>

          <p className="relative z-10 text-xs text-white/60">
            Teknik Geomatika | Universitas Pembangunan Nasional &ldquo;Veteran&rdquo; Yogyakarta
          </p>
        </aside>

        {/* Form panel */}
        <main className="flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--login-accent-solid) text-xs font-bold text-white">
                LSGG
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-(--md-sys-color-on-surface-variant)">
                Laboratorium Survei Geodesi dan Geometri
              </span>
            </div>

            {/* Logo placeholder — swap for an <img> when the asset is ready. */}
            <div className="mx-auto flex h-24 w-44 items-center justify-center rounded-lg bg-(--md-sys-color-surface-container-high)">
              <span className="text-sm font-medium uppercase text-(--md-sys-color-on-surface-variant)">
                Logo
              </span>
            </div>

            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                Login ke Panel Administrator Laboratorium SGG
              </h1>
              <p className="text-sm text-(--md-sys-color-on-surface-variant)">
                Masuk menggunakan akun NIP atau NIM Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <UnderlineField
                id="nomor_induk"
                label="Nomor Induk (NIP/NIM)"
                icon={<UserRound />}
                type="text"
                inputMode="numeric"
                autoComplete="username"
                placeholder="NIP / NIM"
                value={nomorInduk}
                onChange={(e) => setNomorInduk(e.target.value)}
                hasError={Boolean(error)}
                autoFocus
                required
              />

              <UnderlineField
                id="password"
                label="Password"
                icon={<Lock />}
                type="password"
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hasError={Boolean(error)}
                required
              />

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-md bg-(--md-sys-color-primary) px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--md-sys-color-primary)/80 focus-visible:ring-2 focus-visible:ring-(--md-sys-color-on-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--md-sys-color-surface) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Memproses..." : "Login"}
              </button>

              <a
                href="#"
                className="flex w-full items-center justify-center rounded-md border border-(--md-sys-color-primary) px-4 py-2.5 text-sm font-semibold text-(--md-sys-color-primary) transition-colors hover:bg-(--md-sys-color-on-primary) focus-visible:ring-2 focus-visible:ring-(--md-sys-color-on-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--md-sys-color-surface) focus-visible:outline-none"
              >
                Lupa Password?
              </a>
            </form>
          </div>
        </main>
      </div>

      <footer className="bg-neutral-950 py-3 text-center text-xs text-neutral-300">
        &copy; {new Date().getFullYear()} Laboratorium Survei Geodesi dan
        Geometri
      </footer>
    </div>
  );
}
