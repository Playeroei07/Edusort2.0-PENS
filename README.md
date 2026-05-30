# SortEdu - POLITEKNIK ELEKTRONIKA NEGERI SURABAYA

SortEdu adalah aplikasi web edukasi interaktif yang dirancang khusus untuk anak-anak dengan gangguan motorik. Menggunakan webcam dan sistem AI **YOLOv8** untuk deteksi objek secara real-time, anak-anak dapat bermain sambil melatih koordinasi motorik kasar dan spasial melalui game menyortir buah yang menyenangkan.

Desain UI game ini mengadopsi gaya visual yang ramah anak, terinspirasi dari estetika **Gartic.io** (warna pastel, font gelembung, border tebal kartun, animasi dinamis, serta efek suara instan).

---

## Fitur Utama

1.  **Deteksi Real-time YOLOv8**: Menganalisis frame kamera secara langsung untuk mendeteksi:
    *   `yellow_banana` (Pisang Kuning 🍌)
    *   `red_tomato` (Tomat Merah 🍅)
    *   `green_tomato` (Tomat Hijau / belum matang 🍏)
2.  **Mode Sandbox / Fallback Otomatis**: Jika Anda belum melatih model custom, server akan otomatis menggunakan model default `yolov8n.pt` dan memetakan objek di sekitar (misalnya pisang standard, apel/jeruk sebagai pengganti tomat merah, serta bola hijau/brokoli sebagai pengganti tomat hijau). Dilengkapi dengan **analisis warna HSV** untuk membedakan tomat merah dan tomat hijau secara instan!
3.  **Aksesibilitas Tinggi untuk Gangguan Motorik**:
    *   **Bantuan Suara Cerdas (Piper TTS Offline)**: Instruksi game dibacakan keras-keras dalam Bahasa Indonesia dengan suara natural tanpa perlu koneksi internet! Model suara akan diunduh otomatis saat pertama kali dijalankan.
    *   **Musik Latar (BGM) & Efek Suara**: Dilengkapi musik latar ceria dan efek suara interaktif untuk memotivasi anak.
    *   **Tombol Besar & Spasi Lebar**: Memudahkan penekanan tombol dan mencegah klik yang tidak sengaja.
    *   **Mode Sabar (Timer Mati)**: Menghapus batas waktu bermain untuk mengurangi kecemasan dan tekanan pada anak.
    *   **Sensitivitas Deteksi Dinamis**: Slider untuk mempermudah deteksi di ruangan yang kurang cahaya.
    *   **Pematian Aman (Graceful Shutdown)**: Tombol mematikan mesin AI dan kamera dengan satu kali klik langsung dari layar web.
4.  **Tingkat Permainan Edukatif (Level 1-5)**:
    *   **Level 1-3**: Menemukan buah satu per satu (Pisang Kuning, Tomat Merah, Tomat Hijau).
    *   **Level 4**: Menemukan 2 buah sekaligus (Pisang Kuning + Tomat Merah) untuk melatih koordinasi tangan ganda.
    *   **Level 5 (Sortir Spasial)**: Memilah buah ke keranjang kiri (Tomat Hijau) atau keranjang kanan (Tomat Merah) berdasarkan posisi visual di layar kamera.
5.  **Log Aktivitas & Skor ala Gartic.io**: Menampilkan log aksi real-time dan teman bermain AI ("Robot Pintar 🤖") untuk menyemangati anak.

---

## Cara Menjalankan Aplikasi Web

Project ini sudah dilengkapi script otomatis untuk mengunduh modul Python, mengompilasi frontend React, dan menjalankan server web.

1.  **Langkah-langkah Bermain:**
    *   Jalankan `autorun.bat` (atau `python run.py`).
    *   Script akan otomatis menginstal Python dependencies dari `requirements.txt`.
    *   Model YOLOv8 bawaan dan Piper TTS akan diunduh otomatis (hanya pada run pertama).
    *   Server FastAPI akan menyala dan otomatis membuka browser Anda ke halaman game!

*Catatan: Anda **TIDAK PERLU** menginstal Node.js untuk sekadar memainkan game ini, karena antarmuka web-nya sudah kami "cetak" secara permanen ke dalam folder `backend/dist`.*

---

## Struktur Folder Project

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

---

## Melatih Model YOLO Custom Anda Sendiri

Untuk melatih model agar secara presisi mendeteksi pisang kuning, tomat merah, dan tomat hijau Anda:
1.  Kumpulkan gambar menggunakan webcam Anda dengan menjalankan:
    ```bash
    python backend/model/collect_data.py
    ```
    Tekan tombol `1`, `2`, atau `3` untuk memotret buah Anda.
2.  Buka [backend/model/README.md](file:///d:/Penyimpanan%20Utama/Documents/4_Study%20Documents/1_Politeknik%20Elektronika%20Negeri%20Surabaya/Semester%202/PRAKTIKUM%20/%20PRAK.%20PEMROSESAN%20DATA/SortEdu/backend/model/README.md) untuk melihat panduan lengkap pelabelan di Roboflow dan cara menjalankan training (`train.py`).

Selamat bermain dan belajar! 🎮🌟
