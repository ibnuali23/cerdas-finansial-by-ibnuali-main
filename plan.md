# Cerdas Finansial (MVP) – Rencana Implementasi

## 1) Arsitektur
- **Frontend**: React + Tailwind + shadcn/ui + Recharts
- **Backend**: FastAPI (REST) + JWT Auth
- **Database**: MongoDB (Motor async)
- **Multi-user**: setiap dokumen menyimpan `user_id` dan semua query selalu difilter by `user_id`.

## 2) Autentikasi & Akses
- **Metode**: JWT custom (email + password)
- Password disimpan **hash** (passlib/bcrypt).
- JWT disimpan di `localStorage` (MVP) dan dikirim via header `Authorization: Bearer <token>`.
- **Admin utama**: akun seed otomatis
  - Email: `moebarokocu@gmail.com`
  - Password: `261256`
  - Role: `admin`

## 3) Skema Database (Collections)
Semua ID menggunakan UUID string.

### `users`
- `id`, `name`, `email` (unique), `password_hash`, `role` (`user|admin`), `created_at`

### `payment_methods`
- `id`, `user_id`, `name`, `balance`, `created_at`

### `categories`
- `id`, `user_id`, `kind` (`income|expense`), `name`, `created_at`

### `subcategories`
- `id`, `user_id`, `kind`, `category_id`, `name`, `created_at`

### `budgets`
- `id`, `user_id`, `year`, `month` (1-12), `subcategory_id`, `amount`

### `transactions`
- `id`, `user_id`, `type` (`income|expense`), `date` (`YYYY-MM-DD`),
  `category_id`, `subcategory_id`, `description`, `amount`, `payment_method_id`,
  `created_at`, `updated_at`

### `transfers`
- `id`, `user_id`, `date` (`YYYY-MM-DD`), `from_payment_method_id`, `to_payment_method_id`,
  `amount`, `description`, `created_at`, `updated_at`

## 4) Data Default untuk User Baru
- **Metode pembayaran**: Cash, GoPay, Dana, Bank (balance 0)
- **Income**: Category `Pemasukan` + subkategori sesuai daftar yang Anda beri
- **Expense**: Kategori utama: Kebutuhan, Keinginan, Investasi, Dana Darurat + beberapa subkategori awal (user bebas edit/tambah/hapus)
- **Budget**: otomatis dibuat untuk semua subkategori expense di **bulan berjalan** dengan nilai 0 (bisa diedit)

## 5) API (Ringkas)
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Dashboard
- `GET /api/dashboard/overview?month=YYYY-MM&days=30`
  - ringkasan income/expense/net
  - saldo per metode
  - chart saldo (donut)
  - chart pengeluaran harian (N hari terakhir)
  - pemakaian budget per subkategori (bulan terpilih)
  - riwayat transfer terbaru

### Payment Methods
- `GET/POST /api/payment-methods`
- `PUT/DELETE /api/payment-methods/{id}`

### Categories & Subcategories
- `GET/POST /api/categories?kind=income|expense`
- `PUT/DELETE /api/categories/{id}`
- `GET/POST /api/subcategories` (filter `kind`, `category_id`)
- `PUT/DELETE /api/subcategories/{id}`

### Budgets
- `GET /api/budgets/overview?month=YYYY-MM`
- `PUT /api/budgets` (batch upsert budget per subkategori)

### Transactions (Income/Expense)
- `GET /api/transactions?type=income|expense&month=YYYY-MM`
- `POST /api/transactions`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`
> Semua create/update/delete otomatis mengubah saldo metode pembayaran.

### Transfers
- `GET /api/transfers?month=YYYY-MM`
- `POST /api/transfers`
- `PUT /api/transfers/{id}`
- `DELETE /api/transfers/{id}`

### Admin
- `GET /api/admin/users`
- `DELETE /api/admin/users/{user_id}`

## 6) Alur Frontend
- **/login**: halaman login + registrasi (tabs)
- **/app/dashboard**: ringkasan, chart, saldo, budget usage, tombol “Pindah Uang”
- **/app/transactions**: tab Pemasukan/Pengeluaran + tambah/edit/hapus
- **/app/profile**: accordion pengaturan:
  - Budget per subkategori (per bulan)
  - Metode pembayaran (CRUD)
  - Kategori & subkategori (CRUD)
- **/app/admin**: khusus admin, kelola user

## 7) Testing Approach
- Backend: test login/register, akses data per user (isolasi), create transaksi mempengaruhi saldo, edit/hapus transaksi, transfer antar metode.
- Frontend: test login, create transaksi, lihat dashboard terupdate, edit/hapus, pindah uang, update budget.
- Gunakan `testing_agent_v3` end-to-end + screenshot untuk validasi UI.
