/**
 * Format tanggal ISO (YYYY-MM-DD) menjadi tampilan ringkas, mis. "08 Nov 2026".
 * Nilai kosong ditampilkan sebagai "-".
 */
export function formatTanggal(value: string | null | undefined): string {
  if (!value) return "-";

  // Terima "YYYY-MM-DD" maupun ISO datetime lengkap (mis. ...T00:00:00.000000Z).
  const tanggal = value.slice(0, 10);
  const date = new Date(`${tanggal}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
