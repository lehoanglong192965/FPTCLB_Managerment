<!-- Generated: 2026-06-08 | Files scanned: ~30 | Token estimate: ~600 -->

# Bản đồ các tầng Backend

## API Routes & Ánh xạ Tầng
`POST /api/auth/register` → `AuthController.register` → `AuthService.register` → `UserRepository.save`
`POST /api/auth/login` → `AuthController.login` → `AuthService.login` → `UserRepository.findByEmail`
`GET /oauth2/authorization/google` → `OAuth2 Config` → `CustomOAuth2UserService` → `UserRepository`

*(Lưu ý: Hệ thống đang được cập nhật thêm luồng `POST /api/auth/complete-profile` và OTP)*

## Cấu trúc Gói (Package Structure)
`com.fptu.fcms`
- `/controller`: Controller REST (VD: `AuthController`, `ClubController`, `SemesterController`)
- `/service`: Interface và Implementation chứa Business logic (VD: `AuthServiceImpl`)
- `/repository`: Các interface extends `JpaRepository` (VD: `UserRepository`)
- `/entity`: Entities mapping với SQL Server bằng JPA/Hibernate
- `/dto`: Data Transfer Objects (Request/Response)
- `/security`: Cấu hình SecurityConfig, JWT Filter, OAuth2 Success/Failure Handlers
- `/config`: Cấu hình hệ thống (Swagger, CORS)

## Phân quyền
- **ADMIN (1)**: Quản lý học kỳ, users.
- **ICPDP (2)**: Ban phòng ban quản lý chung.
- **MEMBER (3)**: Sinh viên, có thể là Leader của CLB thông qua `ClubRole`.
