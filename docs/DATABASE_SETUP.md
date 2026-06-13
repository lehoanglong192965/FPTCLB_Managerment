# Hướng dẫn Cài đặt Database (FPTUCLUB)

Tài liệu này hướng dẫn thành viên nhóm cách cài đặt và khởi tạo cơ sở dữ liệu **FPTUCLUB** trên SQL Server để chạy và kiểm thử hệ thống FCMS.

---

## Yêu cầu hệ thống

| Thành phần | Phiên bản |
|---|---|
| SQL Server | 2019 trở lên |
| Java JDK | 21+ |
| Node.js | 18+ |
| sqlcmd | Đi kèm SQL Server |

---

## Bước 1: Nhận file SQL từ nhóm trưởng

Bạn sẽ cần nhận **2 file SQL** từ nhóm trưởng (gửi riêng qua Zalo/Telegram/Drive):

| File | Mục đích |
|---|---|
| `SQLQuery.sql` | Tạo database, toàn bộ bảng, index, và seed data (users, roles, semesters) |
| `leader.sql` | Tạo CLB mẫu + tài khoản Club Leader để test |

---

## Bước 2: Chạy script khởi tạo database

Mở **Command Prompt** hoặc **PowerShell**, di chuyển tới thư mục chứa các file SQL, rồi chạy lần lượt:

```powershell
# Bước 2.1: Tạo database và seed data
sqlcmd -S localhost -U sa -P <mật_khẩu_sa> -I -f 65001 -i SQLQuery.sql

# Bước 2.2: Tạo CLB mẫu và tài khoản Leader
sqlcmd -S localhost -U sa -P <mật_khẩu_sa> -I -f 65001 -i leader.sql
```

> [!IMPORTANT]
> **Bắt buộc dùng flag `-f 65001`** (UTF-8) để đảm bảo tên tiếng Việt (ví dụ: `Nguyễn Văn Một`) lưu đúng vào database.
> Nếu thiếu flag này, ký tự có dấu sẽ bị lưu thành `?`.

> [!NOTE]
> **Flag `-I`** bật `QUOTED_IDENTIFIER` — cần thiết để tránh lỗi khi thao tác với filtered index của SQL Server.

---

## Bước 3: Cấu hình Backend

Mở file `backend/src/main/resources/application.yml` và kiểm tra thông tin kết nối database:

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=FPTUCLUB;encrypt=true;trustServerCertificate=true
    username: sa
    password: <mật_khẩu_sa_của_bạn>
```

> [!WARNING]
> Nếu mật khẩu `sa` của bạn khác `123456`, cần sửa lại trường `password` cho khớp.

---

## Bước 4: Khởi chạy hệ thống

### 4.1. Chạy Backend (Spring Boot)

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Đợi cho đến khi thấy dòng log:
```
Started FcmsApplication in XX.XXX seconds
```

### 4.2. Chạy Frontend (Vite + React)

```powershell
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`.

---

## Bước 5: Xác nhận hoạt động

### Tài khoản test có sẵn

Tất cả tài khoản đều có mật khẩu: **`Password123`**

| Email | Vai trò | MSSV |
|---|---|---|
| `lehoanglong19062005@gmail.com` | Sinh viên (Student) | SE123456 |
| `pdp.manager@fpt.edu.vn` | Cán bộ ICPDP | — |
| `leader.fcode@fpt.edu.vn` | Club Leader (F-Code) | SE160001 |
| `member1@fpt.edu.vn` | Sinh viên | SE170001 |
| `member2@fpt.edu.vn` | Sinh viên | SE170002 |
| `member3@fpt.edu.vn` | Sinh viên | SE170003 |
| `member4@fpt.edu.vn` | Sinh viên | SE170004 |

### Kiểm tra nhanh

1. Truy cập `http://localhost:5173/login`
2. Đăng nhập với `lehoanglong19062005@gmail.com` / `Password123`
3. Vào menu **Đăng Ký Thành Lập CLB**
4. Ở Step 2, nhập MSSV `SE170001` → Hệ thống tự động hiển thị: **Nguyễn Văn Một** ✅

---

## Xử lý sự cố thường gặp

### Lỗi: Tên tiếng Việt hiển thị thành `?`
**Nguyên nhân:** Chạy file SQL không có flag `-f 65001`.
**Cách sửa:** Chạy lại `SQLQuery.sql` và `leader.sql` với flag `-f 65001` (xem Bước 2).

### Lỗi: `Query did not return a unique result: 2 results`
**Nguyên nhân:** Có 2 user trùng `studentId` trong bảng `UserAccount`.
**Cách sửa:**
```sql
-- Kiểm tra trùng lặp
SELECT studentId, COUNT(*) FROM FPTUCLUB.dbo.UserAccount GROUP BY studentId HAVING COUNT(*) > 1;
```

### Lỗi: `QUOTED_IDENTIFIER`
**Nguyên nhân:** Chạy SQL mà không có flag `-I`.
**Cách sửa:** Luôn thêm `-I` khi chạy sqlcmd.

### Lỗi: Backend không kết nối được database sau khi reset
**Nguyên nhân:** HikariPool giữ connection cũ sau khi drop/recreate database.
**Cách sửa:** Restart backend (tắt rồi chạy lại `.\mvnw.cmd spring-boot:run`).
