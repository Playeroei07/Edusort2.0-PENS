# Panduan Training Model YOLOv8 - SortEdu 🍌🍅🍏

Folder ini berisi script untuk membantu Anda mengumpulkan dataset dari webcam (`collect_data.py`) dan melatih model YOLOv8 secara custom (`train.py`) untuk mengenali tiga kelas:
1. `yellow_banana` (Pisang Kuning 🍌)
2. `red_tomato` (Tomat Merah 🍅)
3. `green_tomato` (Tomat Hijau 🍏)

---

## Langkah 1: Kumpulkan Gambar Menggunakan Webcam

Jalankan script kolektor data untuk mengambil foto buah Anda sendiri dari webcam:
```bash
python backend/model/collect_data.py
```
*   Ikuti instruksi di layar: arahkan buah ke kamera dan tekan `1` (Pisang Kuning), `2` (Tomat Merah), atau `3` (Tomat Hijau).
*   Gunakan latar belakang yang berbeda dan jarak yang bervariasi agar model lebih akurat.
*   Disarankan mengambil minimal **50-100 gambar per kelas** untuk hasil yang lumayan.

Hasil foto akan tersimpan secara otomatis di folder:
`dataset/raw/yellow_banana/`
`dataset/raw/red_tomato/`
`dataset/raw/green_tomato/`

---

## Langkah 2: Labeling / Membuat Bounding Box

YOLOv8 memerlukan koordinat bounding box untuk objek. Anda bisa melabeli gambar tersebut secara gratis dan mudah menggunakan **Roboflow**:

1.  Buat akun gratis di [Roboflow](https://roboflow.com/).
2.  Buat **Project Baru** -> Pilih project type **Object Detection** -> Beri nama project (misalnya `SortEdu-Fruits`).
3.  Upload seluruh foto yang telah Anda ambil dari folder `dataset/raw/`.
4.  Gunakan tool pelabelan manual di Roboflow untuk menggambar kotak di sekeliling pisang kuning, tomat merah, dan tomat hijau. Berikan label sesuai kelasnya:
    *   `yellow_banana`
    *   `red_tomato`
    *   `green_tomato`
5.  Setelah selesai melabeli, bagi dataset menjadi **Train**, **Valid**, dan **Test** (Roboflow biasanya menyarankan pembagian otomatis 70% / 20% / 10%).
6.  Klik **Generate New Version** -> Klik **Export Dataset** -> Pilih format **YOLOv8** -> Centang **download zip to computer**.

---

## Langkah 3: Ekstrak Dataset di Project Anda

Ekstrak file `.zip` hasil download dari Roboflow ke dalam folder `dataset/` di root project Anda.
Struktur foldernya harus terlihat seperti ini:

```text
SortEdu/
├── dataset/
│   ├── train/
│   │   ├── images/  (berisi file .jpg)
│   │   └── labels/  (berisi file .txt)
│   ├── valid/
│   │   ├── images/
│   │   └── labels/
│   ├── test/
│   │   ├── images/
│   │   └── labels/
│   ├── dataset.yaml # File konfigurasi dari Roboflow
```

Pastikan isi file `dataset/dataset.yaml` memiliki path yang sesuai, contoh:
```yaml
train: ../dataset/train/images
val: ../dataset/valid/images
test: ../dataset/test/images

nc: 3
names: ['yellow_banana', 'red_tomato', 'green_tomato']
```
*Catatan: Path di atas adalah path relatif terhadap lokasi file config atau run directory.*

---

## Langkah 4: Jalankan Training Model

Setelah dataset diekstrak dan `dataset/dataset.yaml` sudah terkonfigurasi, Anda dapat melatih model YOLOv8 dengan menjalankan:

```bash
python backend/model/train.py
```

*   Script ini akan melatih model YOLOv8 Nano (`yolov8n.pt`) sebanyak 50 epoch.
*   Jika laptop Anda memiliki GPU NVIDIA (CUDA), training akan otomatis berjalan menggunakan GPU agar lebih cepat. Jika tidak, ia akan berjalan di CPU.
*   Setelah training selesai, file weights terbaik (`best.pt`) akan otomatis disalin ke `backend/model/custom_yolo.pt`.
*   Aplikasi web FastAPI akan otomatis memuat file `custom_yolo.pt` saat dijalankan berikutnya.

Selamat mencoba! 🎉
