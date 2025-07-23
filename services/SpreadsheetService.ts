import Papa from "papaparse";

export interface KGBData {
  no: string;
  nama: string;
  nip: string;
  pangkat: string;
  gol: string;
  tempatLahir: string;
  tanggalLahir: string;
  tmtLama: string;
  gajiPokokLama: string;
  masaKerjaLama: string;
  tmtBaru: string;
  gajiPokokBaru: string;
  masaKerjaBaru: string;
  kgbBerikutnya: string;
  olehPejabat: string;
  nomorSurat: string;
  tanggalSurat: string;
  tembusan: string;
  tembusan1: string;
  satker: string;
  di: string;
}

function parseIndonesianDate(dateStr: string): Date {
  if (!dateStr || dateStr.trim() === "") return new Date();

  // Format yang mungkin: DD/MM/YYYY, DD-MM-YYYY, atau DD Month YYYY
  const cleanDate = dateStr.trim();

  // Coba parse format DD/MM/YYYY atau DD-MM-YYYY
  const numericMatch = cleanDate.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10) - 1; // Months are 0-based
    const year = parseInt(numericMatch[3], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Coba parse format DD Month YYYY (contoh: 01 Januari 2024)
  const monthNames = {
    januari: 0,
    februari: 1,
    maret: 2,
    april: 3,
    mei: 4,
    juni: 5,
    juli: 6,
    agustus: 7,
    september: 8,
    oktober: 9,
    november: 10,
    desember: 11,
  };

  const textMatch = cleanDate.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);

    if (monthNames.hasOwnProperty(monthStr)) {
      const month = monthNames[monthStr as keyof typeof monthNames];
      if (!isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }

  return new Date(); // Return current date if all parsing attempts fail
}

export async function fetchKGBData(): Promise<KGBData[]> {
  try {
    const SHEET_ID = "1aUaVK6m6NMsw0hliH-wwlqb2ayLd6CHuT8F0rIUNvyM";
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Gagal mengunduh data: ${response.status}`);
    }

    const csvText = await response.text();
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Sesuaikan header dengan nama field di interface
        const headerMap: { [key: string]: string } = {
          NO: "no",
          NAMA: "nama",
          NIP: "nip",
          PANGKAT: "pangkat",
          GOL: "gol",
          "TMP LAHIR": "tempatLahir",
          "TGL LAHIR": "tanggalLahir",
          "TMT KGB LAMA/PANGKAT": "tmtLama",
          "GAJI POKOK LAMA": "gajiPokokLama",
          "MASA KERJA LAMA": "masaKerjaLama",
          "TMT KGB BARU": "tmtBaru",
          "GAJI POKOK BARU": "gajiPokokBaru",
          "MASA KERJA BARU": "masaKerjaBaru",
          "KGB BERIKUTNYA": "kgbBerikutnya",
          "OLEH PEJABAT": "olehPejabat",
          NOMOR_SRT: "nomorSurat",
          TGL: "tanggalSurat",
          TEMBUSAN: "tembusan",
          TEMBUSAN_1: "tembusan1",
          Satker: "satker",
          di: "di",
        };
        return headerMap[header] || header;
      },
    });

    return data as KGBData[];
  } catch (error) {
    console.error("Error mengambil data KGB:", error);
    throw error;
  }
}

export function calculateKGBStatus(
  kgbData: KGBData
): "akan_datang" | "waktunya" | "terlambat" {
  const today = new Date();
  const kgbDate = parseIndonesianDate(kgbData.tmtBaru);

  // Konversi ke timestamp untuk perbandingan
  const diffDays = Math.floor(
    (kgbDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return "terlambat";
  } else if (diffDays <= 60) {
    return "waktunya";
  } else {
    return "akan_datang";
  }
}

export function formatCurrency(amount: string | undefined | null): string {
  if (!amount || amount.trim() === "") return "Rp 0";

  try {
    // Bersihkan string dari karakter non-angka
    const cleanAmount = amount.toString().replace(/[^\d]/g, "");
    const number = parseInt(cleanAmount, 10);

    if (isNaN(number)) return "Rp 0";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  } catch (error) {
    return "Rp 0";
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "") return "-";

  try {
    const date = parseIndonesianDate(dateStr);
    if (isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (error) {
    return "-";
  }
}
