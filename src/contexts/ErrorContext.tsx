import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setApiErrorHandler, type ApiError } from "@/services/api";
import { getFriendlyError, type FriendlyError, type ErrorOptions } from "@/utils/errors";
import { useAdminAuth } from "./AdminAuthContext";
import { ErrorModal, type ActiveError } from "@/components/ui/ErrorModal";

interface ErrorContextValue {
  /**
   * Tampilkan error apa pun (ApiError, kegagalan jaringan, Error biasa)
   * sebagai modal global dengan pesan yang sudah diterjemahkan.
   */
  showError: (err: unknown, opts?: ErrorOptions) => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useError(): ErrorContextValue {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within ErrorProvider");
  }
  return context;
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [activeError, setActiveError] = useState<ActiveError | null>(null);
  const { logout } = useAdminAuth();

  const showError = useCallback((err: unknown, opts?: ErrorOptions) => {
    const friendly: FriendlyError = getFriendlyError(err);
    setActiveError((current) => {
      // Dedupe: jangan re-trigger modal dengan isi yang sama (mis. request paralel gagal bersamaan).
      if (current && current.kind === friendly.kind && current.message === friendly.message) {
        return current;
      }
      return { ...friendly, onRetry: opts?.onRetry };
    });
  }, []);

  // Daftarkan handler global — semua kegagalan api() (kecuali 422) otomatis tampil di modal.
  useEffect(() => {
    setApiErrorHandler((apiError: ApiError) => showError(apiError));
    return () => setApiErrorHandler(null);
  }, [showError]);

  const handleClose = useCallback(() => {
    // Catat dulu sebelum state dikosongkan: 401 → logout + redirect setelah modal ditutup.
    const wasUnauthorized = activeError?.kind === "unauthorized";
    setActiveError(null);
    if (wasUnauthorized) {
      void logout();
    }
  }, [activeError, logout]);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <ErrorModal error={activeError} onClose={handleClose} />
    </ErrorContext.Provider>
  );
}
