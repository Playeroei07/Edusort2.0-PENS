# Changelog EduSort 🚀

Semua perubahan dan fitur terbaru yang ditambahkan pada aplikasi EduSort akan didokumentasikan di sini.

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
├── README.md                 # Petunjuk penggunaan utama
├── CHANGELOG.md              # Riwayat pembaruan sistem terbaru
├── requirements.txt          # Daftar pustaka Python backend
├── run.py                    # Script startup otomatis sekali klik
├── autorun.bat               # Shortcut Windows untuk mengeksekusi run.py
│
├── backend/                  # MESIN AI & SERVER
│   ├── app.py                # Server FastAPI & WebSocket deteksi YOLOv8
│   ├── dist/                 # Folder hasil kompilasi frontend (Sistem Front-End Mandiri)
│   └── model/
│       └── custom_yolo.pt    # File otak pendeteksi buah kustom (opsional)
│
└── frontend/                 # SUMBER DESAIN & ANTARMUKA (Hanya untuk Development)
    ├── node_modules/         # Folder raksasa tempat penyimpanan pustaka Javascript (tersembunyi/jangan dikirim)
    ├── package.json          # Library & dependencies React
    ├── vite.config.js        # Konfigurasi compiler Vite yang baru
    ├── index.html            # File HTML utama (memuat Google Fonts kustom)
    ├── public/               # File aset statis
    │   └── Toybox Riot.mp3   # Musik Latar (BGM)
    └── src/
        ├── main.jsx          # Entry point React
        ├── App.jsx           # Logika utama game, routing level, dan layout
        ├── index.css         # Desain UI tema kartun & sistem variabel HSL
        ├── components/       # Kepingan UI (Lego)
        │   ├── GameScreen.jsx   # Stream webcam, WebSocket, & kotak pembatas
        │   ├── ScoreBoard.jsx   # Papan skor pemain dan animasi Robot
        │   ├── ActivityLog.jsx  # Chatbox log game
        │   └── ControlPanel.jsx # Menu aksesibilitas & tombol Graceful Shutdown
        └── utils/            # Modul Fungsionalitas Ekstra
            ├── audio.js         # Sintesis suara Web Audio API & Pemutar BGM
            └── tts.js           # Penghubung WebSocket ke backend Piper TTS
```
