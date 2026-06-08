<!-- Generated: 2026-06-08 | Files scanned: ~50 | Token estimate: ~500 -->

# Kiến trúc Hệ thống Tổng quan (FCMS)

## Tổng thể (Client-Server)
Dự án **FPT Club Management System (FCMS)** tuân theo kiến trúc Client-Server RESTful:
- **Frontend (Client):** Vite + React 19 SPA, đóng vai trò hiển thị UI, quản lý state và gọi API đến Backend.
- **Backend (Server):** Spring Boot 3.2.5, chịu trách nhiệm xử lý logic nghiệp vụ, bảo mật, và truy xuất cơ sở dữ liệu.
- **Database:** Microsoft SQL Server.

## Luồng dữ liệu (Data Flow)
```ascii
[ Trình duyệt Web (React) ] 
       | (HTTP/REST + JWT) 
       v
[ Spring Security / OAuth2 ]  --Xác thực--> [ Google Auth ]
       | (Filter Chain)
       v
[ Controller (REST API) ]     --Nhận/Trả DTO
       |
[ Service (Business Logic) ]  --Nghiệp vụ cốt lõi
       |
[ Repository (Spring Data) ]  --JPA / Hibernate
       |
[ SQL Server Database ]       --FPTUCLUB DB
```

## Các Module Chính
- **Auth/Security:** Xử lý đăng nhập, đăng ký, cấp JWT, và Google OAuth2. Có luồng duyệt thẻ sinh viên (Pending Verification).
- **Club Management:** Quản lý CLB, duyệt thành viên, KPI, sự kiện.
- **Admin/ICPDP:** Quản lý học kỳ, phê duyệt hệ thống.
