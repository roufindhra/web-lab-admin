import { ApiError } from "@/services/api";

export type ErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "notfound"
  | "validation"
  | "server"
  | "unknown";

export interface FriendlyError {
  kind: ErrorKind;
  title: string;
  message: string;
  /** Pesan teknis asli dari server/browser — hanya untuk debugging. */
  detail?: string;
  /** Error validasi per field (sudah diterjemahkan), khusus 422. */
  fieldErrors?: Record<string, string[]>;
  status?: number;
}

export interface ErrorOptions {
  /** Aksi yang dijalankan saat pengguna menekan "Coba Lagi" di modal. */
  onRetry?: () => void;
}

/**
 * Label rapi untuk nama field Laravel (snake_case maupun tampilan dengan spasi).
 */
const FIELD_LABELS: Record<string, string> = {
  password: "Password",
  password_lama: "Password lama",
  password_baru: "Password baru",
  password_baru_confirmation: "Konfirmasi password baru",
  nomor_induk: "Nomor induk",
  nim: "NIM",
  nama: "Nama",
  nama_alat: "Nama alat",
  merek: "Merek",
  email: "Email",
  surel: "Email",
  angkatan: "Angkatan",
  tanggal: "Tanggal",
  tanggal_mulai: "Tanggal mulai",
  tanggal_selesai: "Tanggal selesai",
  jam_mulai: "Jam mulai",
  jam_selesai: "Jam selesai",
  keperluan: "Keperluan",
  kode: "Kode",
  token: "Token",
  serial_number: "Serial number",
  inventaris: "Nomor inventaris",
  lokasi: "Lokasi",
  jumlah: "Jumlah",
  slug: "Slug",
  semester: "Semester",
  judul: "Judul",
  materi: "Materi",
  link: "Tautan",
  file: "Berkas",
  nilai: "Nilai",
  kelompok: "Kelompok",
  keterangan: "Keterangan",
  status: "Status",
  durasi: "Durasi",
  alat: "Alat",
  praktikum: "Praktikum",
};

function labelize(token: string): string {
  const key = token.toLowerCase().replace(/[\s_]+/g, "_");
  return FIELD_LABELS[key] ?? token.replace(/_/g, " ");
}

/**
 * Terjemahan pesan validasi bawaan Laravel (Inggris) ke Bahasa Indonesia.
 * Pesan yang sudah berbahasa Indonesia (mis. dari AuthService) diteruskan apa adanya.
 */
const VALIDATION_RULES: Array<{ pattern: RegExp; render: (m: RegExpMatchArray) => string }> = [
  {
    pattern: /^The (.+?) field is required when .+$/,
    render: (m) => `Kolom ${labelize(m[1])} wajib diisi.`,
  },
  {
    pattern: /^The (.+?) field is required\.$/,
    render: (m) => `Kolom ${labelize(m[1])} wajib diisi.`,
  },
  {
    pattern: /^The (.+?) must be a valid email address\.$/,
    render: (m) => `${labelize(m[1])} harus berupa alamat email yang valid.`,
  },
  {
    pattern: /^The (.+?) has already been taken\.$/,
    render: (m) => `${labelize(m[1])} sudah digunakan.`,
  },
  {
    pattern: /^The (.+?) must be at least (\d+) characters\.$/,
    render: (m) => `${labelize(m[1])} minimal ${m[2]} karakter.`,
  },
  {
    pattern: /^The (.+?) must not be greater than (\d+) characters\.$/,
    render: (m) => `${labelize(m[1])} maksimal ${m[2]} karakter.`,
  },
  {
    pattern: /^The (.+?) may not be greater than (\d+) characters\.$/,
    render: (m) => `${labelize(m[1])} maksimal ${m[2]} karakter.`,
  },
  {
    pattern: /^The (.+?) must have at least (\d+) items\.$/,
    render: (m) => `${labelize(m[1])} minimal ${m[2]} item.`,
  },
  {
    pattern: /^The (.+?) must not have more than (\d+) items\.$/,
    render: (m) => `${labelize(m[1])} maksimal ${m[2]} item.`,
  },
  {
    pattern: /^The (.+?) must be a number\.$/,
    render: (m) => `${labelize(m[1])} harus berupa angka.`,
  },
  {
    pattern: /^The (.+?) must be an integer\.$/,
    render: (m) => `${labelize(m[1])} harus berupa angka bulat.`,
  },
  {
    pattern: /^The (.+?) must be a string\.$/,
    render: (m) => `${labelize(m[1])} harus berupa teks.`,
  },
  {
    pattern: /^The (.+?)(?: field)? must be a valid date\.$/,
    render: (m) => `${labelize(m[1])} harus berupa tanggal yang valid.`,
  },
  {
    pattern: /^The (.+?) field must be a date\.$/,
    render: (m) => `${labelize(m[1])} harus berupa tanggal yang valid.`,
  },
  {
    pattern: /^The selected (.+?) is invalid\.$/,
    render: (m) => `Pilihan ${labelize(m[1]).toLowerCase()} tidak valid.`,
  },
  {
    pattern: /^The (.+?) format is invalid\.$/,
    render: (m) => `Format ${labelize(m[1]).toLowerCase()} tidak valid.`,
  },
  {
    pattern: /^The (.+?) confirmation does not match\.$/,
    render: (m) => `Konfirmasi ${labelize(m[1]).toLowerCase()} tidak cocok.`,
  },
  {
    pattern: /^The (.+?) must be at least (\d+) kB\.$/,
    render: (m) => `Ukuran ${labelize(m[1]).toLowerCase()} minimal ${m[2]} kB.`,
  },
  {
    pattern: /^The (.+?)(?: may| must) not be greater than (\d+) kB\.$/,
    render: (m) => `Ukuran ${labelize(m[1]).toLowerCase()} maksimal ${m[2]} kB.`,
  },
  {
    pattern: /^The (.+?) must be one of: (.+)\.$/,
    render: (m) => `${labelize(m[1])} harus salah satu dari: ${m[2]}.`,
  },
  {
    pattern: /^The (.+?) must be between (\d+) and (\d+)\.$/,
    render: (m) => `${labelize(m[1])} harus di antara ${m[2]} dan ${m[3]}.`,
  },
  {
    pattern: /^The (.+?) must be at least (\d+)\.$/,
    render: (m) => `${labelize(m[1])} minimal ${m[2]}.`,
  },
  {
    pattern: /^The (.+?)(?: may| must) not be greater than (\d+)\.$/,
    render: (m) => `${labelize(m[1])} maksimal ${m[2]}.`,
  },
  {
    pattern: /^The (.+?) must be a date after (.+)\.$/,
    render: (m) => `${labelize(m[1])} harus berupa tanggal setelah ${m[2]}.`,
  },
  {
    pattern: /^The (.+?) must be a date before (.+)\.$/,
    render: (m) => `${labelize(m[1])} harus berupa tanggal sebelum ${m[2]}.`,
  },
  {
    pattern: /^The (.+?) must be a valid URL\.$/,
    render: (m) => `${labelize(m[1])} harus berupa URL yang valid.`,
  },
  {
    pattern: /^The (.+?) field must be true or false\.$/,
    render: (m) => `${labelize(m[1])} harus berupa ya atau tidak.`,
  },
  {
    pattern: /^The (.+?) must be a file\.$/,
    render: (m) => `${labelize(m[1])} harus berupa berkas.`,
  },
  {
    pattern: /^The (.+?) must be an image\.$/,
    render: (m) => `${labelize(m[1])} harus berupa gambar.`,
  },
];

export function translateValidationMessage(message: string): string {
  for (const rule of VALIDATION_RULES) {
    const match = message.match(rule.pattern);
    if (match) return rule.render(match);
  }
  return message;
}

/**
 * Terjemahkan struktur errors Laravel (per field) ke Bahasa Indonesia.
 */
export function translateFieldErrors(
  fieldErrors: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    result[field] = messages.map(translateValidationMessage);
  }
  return result;
}

/**
 * Daftar pesan error (sudah diterjemahkan) untuk ditampilkan inline di form.
 * Mengembalikan array kosong jika error bukan validasi 422.
 */
export function getFormErrorMessages(err: unknown): string[] {
  if (err instanceof ApiError && err.fieldErrors) {
    return Object.values(translateFieldErrors(err.fieldErrors)).flat();
  }
  return [];
}

function fromApiError(err: ApiError): FriendlyError {
  const fieldErrors = err.fieldErrors ? translateFieldErrors(err.fieldErrors) : undefined;

  switch (err.status) {
    case 0:
      return {
        kind: "network",
        title: "Koneksi Terputus",
        message:
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.",
        detail: err.message,
        status: err.status,
      };
    case 401:
      return {
        kind: "unauthorized",
        title: "Sesi Berakhir",
        message:
          "Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali untuk melanjutkan.",
        detail: err.message,
        status: err.status,
      };
    case 403:
      return {
        kind: "forbidden",
        title: "Akses Ditolak",
        message:
          "Anda tidak memiliki izin untuk melakukan aksi ini. Jika menurut Anda ini keliru, hubungi admin lab.",
        detail: err.message,
        status: err.status,
      };
    case 404:
      return {
        kind: "notfound",
        title: "Tidak Ditemukan",
        message: "Data yang Anda minta tidak ditemukan atau sudah dihapus.",
        detail: err.message,
        status: err.status,
      };
    case 422:
      return {
        kind: "validation",
        title: "Data Belum Lengkap",
        message:
          fieldErrors && Object.keys(fieldErrors).length > 0
            ? Object.values(fieldErrors).flat()[0]
            : "Periksa kembali data yang Anda isi.",
        fieldErrors,
        detail: err.message,
        status: err.status,
      };
    case 429:
      return {
        kind: "server",
        title: "Terlalu Banyak Percobaan",
        message:
          "Anda melakukan terlalu banyak permintaan dalam waktu singkat. Tunggu sebentar, lalu coba lagi.",
        detail: err.message,
        status: err.status,
      };
    default:
      if (err.status >= 500) {
        return {
          kind: "server",
          title: "Kesalahan Server",
          message:
            "Terjadi kendala di server lab. Tidak ada data yang berubah — silakan coba lagi beberapa saat lagi.",
          detail: err.message,
          status: err.status,
        };
      }
      return {
        kind: "unknown",
        title: "Terjadi Kesalahan",
        message: err.message || "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.",
        detail: err.message,
        status: err.status,
      };
  }
}

/**
 * Ubah error apa pun (ApiError, kegagalan jaringan, Error biasa) menjadi
 * pesan yang ramah untuk pengguna.
 */
export function getFriendlyError(err: unknown): FriendlyError {
  if (err instanceof ApiError) {
    return fromApiError(err);
  }
  if (err instanceof TypeError) {
    return {
      kind: "network",
      title: "Koneksi Terputus",
      message:
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.",
      detail: String(err),
    };
  }
  if (err instanceof Error) {
    return {
      kind: "unknown",
      title: "Terjadi Kesalahan",
      message: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
      detail: err.message,
    };
  }
  return {
    kind: "unknown",
    title: "Terjadi Kesalahan",
    message: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
    detail: String(err),
  };
}
