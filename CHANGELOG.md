# Changelog EduSort 🚀

Semua perubahan dan fitur terbaru yang ditambahkan pada aplikasi EduSort akan didokumentasikan di sini.

## [v2.0.1] - Stabilitas & Skalabilitas (Patch Kritis)

### 🛡️ Ketahanan Sistem (Resilience & Architecture)
- **Multi-Threading AI (Anti-Lag)**: Mengubah struktur backend FastAPI dengan mengimplementasikan `asyncio.to_thread`. Pemrosesan visi AI (YOLO) dan generasi suara TTS kini berjalan di *thread pool* terpisah, sehingga tidak lagi memblokir sistem utama (*Event Loop*). Aplikasi kini kebal dari *lag* visual meskipun dipasang di PC lama/lambat atau diakses banyak perangkat sekaligus.
- **WebSocket Self-Healing**: Memperbaiki kelemahan *memory leak* pada WebSocket (`GameScreen.jsx`). Sistem kini mampu melakukan deteksi koneksi terputus dan akan mencoba menyambung ulang (*auto-reconnect*) secara otomatis dalam 3 detik, dan berhenti bersih ketika komponen layar kamera ditutup.
- **Deteksi Hardware Cerdas (GPU/CPU)**: Skrip pelatihan AI (`train.py`) kini otomatis menggunakan fungsi internal PyTorch (`torch.cuda.is_available()`) untuk mendeteksi kartu grafis. Hal ini mencegah *Crash / Blue Screen* pada komputer/laptop biasa yang tidak memiliki driver NVIDIA (sekarang langsung pindah ke mode CPU secara halus).

### 🐛 Perbaikan Bug (Bug Fixes)
- **Timer Race Condition**: Memisahkan logika hitung mundur waktu habis (0 detik) di `App.jsx` ke dalam *watcher* independen. Hal ini menutup celah *bug* di mana pemain bisa lompat level dua kali atau mendapat skor ganda jika internet/komputer sesaat melambat.
- **TTS Multi-Device Support**: Memperbaiki sistem URL *Text-to-Speech* pada `tts.js` agar menjadi dinamis. Jika komputer guru dijadikan server lokal, fitur suara kini bisa ikut terdengar dari layar murid yang menggunakan iPad/Tablet lewat jaringan Wi-Fi lokal, tidak lagi hanya terdengar di server saja.
- **Audio Mute/Unmute Flow**: Memperbaiki logika pemutaran BGM di `audio.js`. BGM kini selalu diputar (meski secara *silent*) saat permainan dimulai dalam mode *Mute*. Sehingga saat *user* mendadak mematikan opsi Mute (Unmute) di pertengahan game, musik BGM akan langsung tersambung dan berbunyi, bukan menghilang.

## [v2.0.0] - Update Besar-besaran 

### ✨ Fitur Baru (New Features)
- **Robot Pintar 🤖 (Activity Log)**: Menambahkan panel interaktif di sebelah kanan layar (mirip *chatbox* Gartic.io) yang menampilkan log aktivitas permainan secara *real-time*, lengkap dengan sapaan lucu untuk memandu anak bermain.
- **Piper TTS Offline (Kecerdasan Suara Asli)**: Menggantikan suara bawaan browser (*Web Speech API*) yang terdengar seperti robot dengan **Piper TTS (AI)** berukuran medium (Bahasa Indonesia). Suara kini terdengar sangat natural bak pembawa acara, berjalan 100% secara lokal tanpa perlu internet!
- **Musik Latar (Background Music / BGM)**: Sistem kini mendukung pemutaran lagu latar secara *looping* (lagu *Toybox Riot.mp3*) selama sesi bermain berlangsung.
- **Tombol "Graceful Shutdown" (Pematian Aman)**: Menambahkan tombol merah besar "MATIKAN SISTEM & KAMERA" di menu bawah. Pengguna kini bisa mematikan mesin Python dan memutuskan sambungan kamera langsung dari layar *web*, tanpa perlu menyentuh layar Terminal hitam.

### 🐛 Perbaikan (Bug Fixes)
- **Pemusnahan Bug Akhir Game**: Memperbaiki alur navigasi agar setelah pemain menyelesaikan seluruh misi (Game Over), layar tidak kembali mengulang ke halaman awal secara aneh, melainkan menampilkan status "Selamat" dengan efek kembang api (*Confetti*) yang megah.

### 🛠️ Peningkatan Sistem (Under-the-Hood)
- **Kompilasi Frontend (Vite)**: Mengubah kerangka kerja dari *React script* biasa menjadi Vite yang jauh lebih cepat. Hasil akhir aplikasi kini dicetak menjadi file HTML/JS statis (`backend/dist`), sehingga aplikasi tidak lagi mewajibkan instalasi *Node.js* bagi pemain/pengguna akhir.

### 📁 Perubahan Struktur Folder (New Directory Structure)
Seiring dengan transformasi dari aplikasi React klasik menjadi aplikasi web utuh yang mandiri, struktur direktori kini telah dirombak dan dirapihkan menjadi seperti berikut:

```text
SortEdu/
├── .gitignore                # Aturan pengecualian file Git
├── CHANGELOG.md              # Riwayat pembaruan sistem terbaru
├── README.md                 # Petunjuk penggunaan utama
├── Toybox Riot.mp3           # (BGM Cadangan/Duplikat di Root)
├── autorun.bat               # Shortcut Windows untuk mengeksekusi run.py
├── requirements.txt          # Daftar pustaka Python backend
├── run.py                    # Script startup otomatis sekali klik
│
├── backend/                  # MESIN AI & SERVER
│   ├── app.py                # Server FastAPI & WebSocket deteksi YOLOv8
│   ├── dist/                 # Folder hasil kompilasi frontend (Sistem Front-End Mandiri)
│   ├── tts_cache/            # Folder penyimpanan cache suara robot (Otomatis)
│   └── model/                # Folder khusus pemrosesan & training YOLO
│       ├── README.md         # Panduan melatih AI Custom
│       ├── collect_data.py   # Script pengumpul dataset kamera
│       ├── train.py          # Script pelatihan AI pintar
│       ├── custom_yolo.pt    # File otak pendeteksi buah kustom (opsional)
│       └── piper/            # Folder model AI Suara (Otomatis terunduh)
│
├── frontend/                 # SUMBER DESAIN & ANTARMUKA (Hanya untuk Development)
│   ├── node_modules/         # Folder dependensi Javascript (tersembunyi/di-ignore)
│   ├── package-lock.json     # Kunci versi dependensi Node.js
│   ├── package.json          # Library & dependencies React
│   ├── vite.config.js        # Konfigurasi compiler Vite yang baru
│   ├── index.html            # File HTML utama (memuat Google Fonts kustom)
│   ├── public/               # File aset statis
│   │   └── Toybox_Riot.mp3   # Musik Latar (BGM) Utama
│   └── src/                  # Kode sumber program antarmuka
│       ├── main.jsx          # Entry point React
│       ├── App.jsx           # Logika utama game, routing level, dan layout
│       ├── index.css         # Desain UI tema kartun & sistem variabel HSL
│       ├── components/       # Kepingan UI (Lego)
│       │   ├── GameScreen.jsx   # Stream webcam, WebSocket, & kotak pembatas
│       │   ├── ScoreBoard.jsx   # Papan skor pemain dan animasi Robot
│       │   ├── ActivityLog.jsx  # Chatbox log game
│       │   └── ControlPanel.jsx # Menu aksesibilitas & tombol Graceful Shutdown
│       └── utils/            # Modul Fungsionalitas Ekstra
│           ├── audio.js         # Sintesis suara Web Audio API & Pemutar BGM
│           └── tts.js           # Penghubung WebSocket ke backend Piper TTS
│
└── runs/                     # Log hasil pelatihan YOLOv8 (Otomatis)
```
