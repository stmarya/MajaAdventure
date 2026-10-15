/**
 * config.js
 * Konfigurasi global engine — SATU SUMBER KEBENARAN untuk semua konstanta.
 * Nilai di sini harus konsisten dengan docs/project_config.json.
 *
 * Aturan: tidak ada konstanta game yang boleh hardcode di file lain.
 * Selalu impor dari sini.
 */

export const KONFIG = Object.freeze({
  // ─── Canvas & Rendering ────────────────────────────────────────────────────
  CANVAS_LEBAR:       320,
  CANVAS_TINGGI:      180,
  SKALA_DEFAULT:      3,        // 320×180 → 960×540 tampil di layar
  SKALA_MIN:          1,
  SKALA_MAKS:         4,

  // ─── Fisika ────────────────────────────────────────────────────────────────
  GRAVITASI:          0.4,      // pixel/frame²
  KECEPATAN_MAX_Y:    8,        // terminal velocity (pixel/frame ke bawah)
  KECEPATAN_JALAN:    2,        // pixel/frame (saat menahan tombol pelan/jongkok)
  KECEPATAN_LARI:     3,        // pixel/frame (gerak normal)
  KECEPATAN_LOMPAT:  -7,        // pixel/frame (negatif = ke atas)
  FRICTION:           0.7,      // koefisien perlambatan saat tidak ada input horizontal

  // ─── Tile ──────────────────────────────────────────────────────────────────
  UKURAN_TILE:        16,       // px

  // ─── Sprite ────────────────────────────────────────────────────────────────
  FRAME_LEBAR:        48,       // lebar frame karakter utama (px)
  FRAME_TINGGI:       48,       // tinggi frame karakter utama (px)

  // ─── HUD ───────────────────────────────────────────────────────────────────
  HEALTHBAR_LEBAR:    96,       // px
  HEALTHBAR_TINGGI:   12,       // px
  HEALTHBAR_PADDING:  2,        // px dalam dari tepi frame

  // ─── Game Loop ─────────────────────────────────────────────────────────────
  FPS_TARGET:         60,
  DT_MAX:             0.05,     // clamp delta time (detik) — cegah lonjakan fisika

  // ─── Audio ─────────────────────────────────────────────────────────────────
  VOLUME_BGM_DEFAULT: 0.7,
  VOLUME_SFX_DEFAULT: 1.0,

  // ─── Warna Palette (HEX) ───────────────────────────────────────────────────
  // Hanya warna yang dibutuhkan engine untuk placeholder/fallback render.
  // Palette lengkap ada di docs/color_palette.json.
  WARNA: {
    HITAM_TUA:        "#2B1810",
    COKLAT_GELAP:     "#5C2E1A",
    MERAH_BATA:       "#C1440E",
    MERAH_TERAKOTA:   "#E8623A",
    EMAS_TUA:         "#D4A017",
    KUNING_EMAS:      "#F5C842",
    PUTIH_GADING:     "#F0EBD8",
    HIJAU_GELAP:      "#2D5016",
    HIJAU_HUTAN:      "#4A7C2F",
    BIRU_INDIGO:      "#1A3A5C",
    ABU_BATU:         "#7A6650",
  },

  // ─── Background Loading Screen ─────────────────────────────────────────────
  WARNA_BG_LOADING:   "#1a0f08",
});
