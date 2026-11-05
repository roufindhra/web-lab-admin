const BASE_URL = import.meta.env.VITE_API_URL

export const TOKEN_KEY = 'admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  /** Error validasi per field dari Laravel (HTTP 422), belum diterjemahkan. */
  fieldErrors?: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/**
 * Handler global untuk error API — didaftarkan oleh ErrorProvider.
 * Dipanggil otomatis untuk semua error kecuali validasi 422 (ditangani form)
 * dan request dengan opsi `silent`.
 */
type ApiErrorHandler = (error: ApiError) => void

let apiErrorHandler: ApiErrorHandler | null = null

export function setApiErrorHandler(handler: ApiErrorHandler | null): void {
  apiErrorHandler = handler
}

export interface ApiRequestOptions extends RequestInit {
  /** Jika true, error tidak ditampilkan otomatis di modal global. */
  silent?: boolean
}

function notifyGlobalHandler(error: ApiError, silent: boolean): void {
  // 422 = validasi form → ditangani inline oleh pemanggil, bukan modal.
  if (!silent && error.status !== 422) {
    apiErrorHandler?.(error)
  }
}

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { silent = false, ...requestOptions } = options

  const isFormData = requestOptions.body instanceof FormData

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(requestOptions.headers as Record<string, string>),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...requestOptions,
      headers,
    })
  } catch {
    const networkError = new ApiError(0, 'Tidak dapat terhubung ke server.')
    notifyGlobalHandler(networkError, silent)
    throw networkError
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      removeToken()
    }
    const fieldErrors =
      typeof data?.errors === 'object' && data?.errors !== null
        ? (data.errors as Record<string, string[]>)
        : undefined
    const message =
      (data?.message as string) ??
      (fieldErrors ? Object.values(fieldErrors).flat().join(' ') : 'Terjadi kesalahan.')
    const error = new ApiError(response.status, message, fieldErrors)
    notifyGlobalHandler(error, silent)
    throw error
  }

  return data as T
}
