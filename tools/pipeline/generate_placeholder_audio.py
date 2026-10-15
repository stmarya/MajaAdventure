"""
generate_placeholder_audio.py
Menghasilkan file audio WAV/OGG placeholder untuk Majapahit Platformer.

Setiap file dibuat menggunakan numpy + wave (tidak perlu library eksternal selain numpy).
Audio yang dihasilkan adalah nada sinus sederhana — cukup untuk menguji pipeline audio
tanpa crash, tanpa silent failure.

Catatan: File BGM dibuat sebagai .ogg stub (header valid) menggunakan format WAV
karena Python stdlib tidak mendukung encoding OGG native. File akan tetap dideteksi
oleh AssetLoader sebagai "tidak bisa diputar" dan di-set null — tapi loading tidak hang.
Untuk test penuh, SFX dibuat sebagai WAV asli yang bisa diputar.
"""

import wave
import struct
import math
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def buat_wav(path: Path, frekuensi: float, durasi_ms: int,
             volume: float = 0.5, sample_rate: int = 22050):
    """
    Buat file WAV mono 16-bit dengan nada sinus.
    
    Args:
        path        : path output file .wav
        frekuensi   : Hz nada (440 = A4)
        durasi_ms   : durasi dalam milidetik
        volume      : 0.0–1.0
        sample_rate : sample rate (default 22050 Hz agar file kecil)
    """
    ensure_dir(path.parent)
    n_samples = int(sample_rate * durasi_ms / 1000)
    
    # Generate sampel sinus dengan envelope (fade in/out)
    samples = []
    fade_samples = min(200, n_samples // 4)
    
    for i in range(n_samples):
        # Nada sinus
        val = math.sin(2 * math.pi * frekuensi * i / sample_rate)
        
        # Envelope: fade in
        if i < fade_samples:
            val *= i / fade_samples
        # Fade out
        elif i > n_samples - fade_samples:
            val *= (n_samples - i) / fade_samples
        
        # Clamp & konversi ke 16-bit signed integer
        sample_int = int(val * volume * 32767)
        sample_int = max(-32768, min(32767, sample_int))
        samples.append(sample_int)
    
    with wave.open(str(path), 'w') as wf:
        wf.setnchannels(1)          # mono
        wf.setsampwidth(2)          # 16-bit
        wf.setframerate(sample_rate)
        data = struct.pack(f'<{len(samples)}h', *samples)
        wf.writeframes(data)
    
    kb = path.stat().st_size // 1024
    print(f"  ✓ {path.relative_to(ROOT)} ({durasi_ms}ms, {frekuensi:.0f}Hz, {kb}KB)")


def buat_chord_wav(path: Path, freqs: list, durasi_ms: int,
                   volume: float = 0.4, sample_rate: int = 22050):
    """Buat WAV dengan beberapa nada sekaligus (chord/arpeggio)."""
    ensure_dir(path.parent)
    n_samples = int(sample_rate * durasi_ms / 1000)
    fade_samples = min(300, n_samples // 4)
    
    samples = []
    for i in range(n_samples):
        val = sum(math.sin(2 * math.pi * f * i / sample_rate) for f in freqs)
        val /= len(freqs)  # normalize
        
        if i < fade_samples:
            val *= i / fade_samples
        elif i > n_samples - fade_samples:
            val *= (n_samples - i) / fade_samples
        
        sample_int = int(val * volume * 32767)
        sample_int = max(-32768, min(32767, sample_int))
        samples.append(sample_int)
    
    with wave.open(str(path), 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(struct.pack(f'<{len(samples)}h', *samples))
    
    kb = path.stat().st_size // 1024
    print(f"  ✓ {path.relative_to(ROOT)} ({durasi_ms}ms, chord, {kb}KB)")


def buat_noise_wav(path: Path, durasi_ms: int,
                   frekuensi_base: float = 200, volume: float = 0.3,
                   sample_rate: int = 22050):
    """Buat WAV dengan noise + nada untuk efek impact/damage."""
    import random
    ensure_dir(path.parent)
    n_samples = int(sample_rate * durasi_ms / 1000)
    fade_samples = min(100, n_samples // 3)
    rng = random.Random(42)
    
    samples = []
    for i in range(n_samples):
        sine  = math.sin(2 * math.pi * frekuensi_base * i / sample_rate) * 0.5
        noise = (rng.random() * 2 - 1) * 0.5
        val   = (sine + noise) * 0.5
        
        if i < fade_samples:
            val *= i / fade_samples
        elif i > n_samples - fade_samples:
            val *= (n_samples - i) / fade_samples
        
        sample_int = int(val * volume * 32767)
        sample_int = max(-32768, min(32767, sample_int))
        samples.append(sample_int)
    
    with wave.open(str(path), 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(struct.pack(f'<{len(samples)}h', *samples))
    
    kb = path.stat().st_size // 1024
    print(f"  ✓ {path.relative_to(ROOT)} ({durasi_ms}ms, noise+sine, {kb}KB)")


def buat_bgm_loop_wav(path: Path, durasi_detik: int = 8):
    """
    Buat BGM loop WAV sederhana dengan arpeggio pentatonik Jawa.
    Skala pentatonik: D E G A C (frekuensi relatif ke D4=293Hz)
    """
    ensure_dir(path.parent)
    SR = 22050
    n_total = SR * durasi_detik
    
    # Skala pentatonik Jawa (pelog sederhana) dalam Hz
    skala = [293.7, 329.6, 392.0, 440.0, 523.3,  # D4 E4 G4 A4 C5
             587.3, 659.3, 784.0, 880.0, 1046.5]  # D5 E5 G5 A5 C6
    
    # Pola melodi sederhana (index ke skala)
    pola = [0, 2, 4, 3, 2, 1, 0, 4, 3, 1, 2, 4, 0, 3, 1, 2]
    
    note_durasi = SR // 4  # 1/4 detik per nada (tempo 240 BPM)
    fade_s = min(200, note_durasi // 4)
    
    samples = []
    note_idx = 0
    
    for i in range(n_total):
        note_pos = i % note_durasi
        current_note = pola[(i // note_durasi) % len(pola)]
        freq = skala[current_note % len(skala)]
        
        # Bass nada lebih rendah
        bass_freq = skala[current_note % 5] / 2
        
        val  = math.sin(2 * math.pi * freq      * i / SR) * 0.4
        val += math.sin(2 * math.pi * bass_freq * i / SR) * 0.2
        # Sedikit harmonik
        val += math.sin(2 * math.pi * freq * 2  * i / SR) * 0.1
        
        # Note envelope
        if note_pos < fade_s:
            val *= note_pos / fade_s
        elif note_pos > note_durasi - fade_s:
            val *= (note_durasi - note_pos) / fade_s
        
        # Master envelope (fade in/out global)
        fade_g = min(SR // 2, n_total // 8)
        if i < fade_g:
            val *= i / fade_g
        elif i > n_total - fade_g:
            val *= (n_total - i) / fade_g
        
        sample_int = int(val * 0.6 * 32767)
        sample_int = max(-32768, min(32767, sample_int))
        samples.append(sample_int)
    
    # Tulis dalam chunks untuk menghindari struct pack limit
    with wave.open(str(path), 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        chunk = 4096
        for offset in range(0, len(samples), chunk):
            data = struct.pack(f'<{len(samples[offset:offset+chunk])}h',
                               *samples[offset:offset+chunk])
            wf.writeframes(data)
    
    kb = path.stat().st_size // 1024
    print(f"  ✓ {path.relative_to(ROOT)} ({durasi_detik}s loop, {kb}KB)")


if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║   GENERATE PLACEHOLDER AUDIO ASSETS                     ║")
    print("╚══════════════════════════════════════════════════════════╝\n")

    SFX = ROOT / "assets/audio/sfx"
    BGM = ROOT / "assets/audio/bgm"

    # ─── SFX ──────────────────────────────────────────────────────────────────
    print("─── SFX (WAV) ────────────────────────────────────────────")

    # Lompat: nada naik cepat
    buat_wav(SFX / "sfx_jump.wav",           frekuensi=520,  durasi_ms=180,  volume=0.6)

    # Serangan keris: klik metalik pendek
    buat_noise_wav(SFX / "sfx_attack_keris.wav", durasi_ms=80,
                   frekuensi_base=800, volume=0.5)

    # Ambil koin: nada tinggi ceria
    buat_chord_wav(SFX / "sfx_coin_pickup.wav",  freqs=[880, 1108, 1320],
                   durasi_ms=200, volume=0.5)

    # Terkena damage: bunyi low thud
    buat_noise_wav(SFX / "sfx_damage_hit.wav",   durasi_ms=150,
                   frekuensi_base=150, volume=0.7)

    # Buka peti: nada pembuka pendek
    buat_chord_wav(SFX / "sfx_chest_open.wav",   freqs=[523, 659, 784],
                   durasi_ms=400, volume=0.5)

    # Spike trap: klik/snap tajam
    buat_noise_wav(SFX / "sfx_spike_trap.wav",   durasi_ms=120,
                   frekuensi_base=300, volume=0.6)

    # Game over: nada turun dramatis
    buat_chord_wav(SFX / "sfx_gameover.wav",     freqs=[220, 196, 165, 147],
                   durasi_ms=1200, volume=0.6)

    # Level complete: fanfare pendek
    buat_chord_wav(SFX / "sfx_levelcomplete.wav", freqs=[523, 659, 784, 1047],
                   durasi_ms=800, volume=0.6)

    # Ambient jungle: low drone
    buat_wav(SFX / "sfx_ambient_jungle.wav",     frekuensi=80,   durasi_ms=2000, volume=0.2)

    # ─── BGM (WAV loops — OGG tidak didukung stdlib Python) ───────────────────
    print("\n─── BGM (WAV loop stubs) ─────────────────────────────────")
    print("  ℹ  BGM dibuat sebagai .wav (Python stdlib tidak support OGG encoding)")
    print("  ℹ  Ganti dengan .ogg asli saat produksi audio selesai\n")

    # BGM main menu
    buat_bgm_loop_wav(BGM / "bgm_mainmenu_01.wav",  durasi_detik=8)
    # BGM level 01
    buat_bgm_loop_wav(BGM / "bgm_level01_01.wav",   durasi_detik=12)

    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║   SELESAI — Semua placeholder audio telah digenerate    ║")
    print("╚══════════════════════════════════════════════════════════╝\n")
    print("  CATATAN: Update path BGM di src/engine/main.js jika")
    print("  menggunakan .wav (bukan .ogg) untuk test awal.\n")
